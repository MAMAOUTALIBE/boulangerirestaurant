import "server-only";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import type {
  CartLineOption,
  Fulfillment,
  Order,
  OrderLine,
  OrderStatus,
} from "@/types";
import { prisma } from "@/lib/prisma";
import { upsertCustomer } from "@/lib/customers";
import { evaluatePromo } from "@/lib/promo";
import { quoteDelivery } from "@/lib/delivery";
import { awardPointsForOrder } from "@/lib/loyalty";
import { formatPrice, roundCurrency } from "@/lib/utils";
import { rawHtml, safeHtml } from "@/lib/html";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { getDefaultRestaurant } from "@/lib/restaurants";
import { getSiteConfig } from "@/lib/site-settings";
import { remainingStock, stockToday } from "@/lib/stock";
import { recordDemoLead } from "@/lib/demo-leads";

interface CreateOrderInput {
  customer: Order["customer"];
  items: OrderLine[];
  promoCode?: string;
  fulfillment?: Fulfillment;
  postalCode?: string;
  tip?: number;
  scheduledAt?: string;
}

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;
type DishWithOptions = Prisma.DishGetPayload<{
  include: {
    optionGroups: {
      include: { options: true };
    };
  };
}>;

export class OrderCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderCreationError";
  }
}

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new OrderCreationError("Quantité invalide.");
  }
  return Math.floor(quantity);
}

function normalizeNote(note?: string): string | undefined {
  const trimmed = note?.trim();
  return trimmed ? trimmed.slice(0, 280) : undefined;
}

function normalizeLineOptions(
  dish: DishWithOptions,
  requested: CartLineOption[] = [],
): CartLineOption[] | undefined {
  const selectedByGroup = new Map<string, CartLineOption[]>();

  for (const option of requested) {
    const group = dish.optionGroups.find((g) => g.id === option.groupId);
    if (!group) {
      throw new OrderCreationError(
        `Option invalide pour ${dish.name}. Rechargez le menu et réessayez.`,
      );
    }

    const dbOption = group.options.find((o) => o.id === option.optionId);
    if (!dbOption) {
      throw new OrderCreationError(
        `Option indisponible pour ${dish.name}. Rechargez le menu et réessayez.`,
      );
    }

    const normalized: CartLineOption = {
      groupId: group.id,
      optionId: dbOption.id,
      label: dbOption.name,
      priceDelta: roundCurrency(dbOption.priceDelta),
    };
    selectedByGroup.set(group.id, [
      ...(selectedByGroup.get(group.id) ?? []),
      normalized,
    ]);
  }

  for (const group of dish.optionGroups) {
    const selected = selectedByGroup.get(group.id) ?? [];
    if (group.required && selected.length === 0) {
      throw new OrderCreationError(
        `Choisissez : ${group.name} pour ${dish.name}.`,
      );
    }
    if (group.type === "single" && selected.length > 1) {
      throw new OrderCreationError(
        `Une seule option possible pour ${group.name}.`,
      );
    }
  }

  const normalized = Array.from(selectedByGroup.values()).flat();
  return normalized.length > 0 ? normalized : undefined;
}

async function normalizeOrderItems(items: OrderLine[]): Promise<OrderLine[]> {
  const slugs = [...new Set(items.map((i) => i.id))];
  const dishes = await prisma.dish.findMany({
    where: { slug: { in: slugs } },
    include: {
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  const bySlug = new Map(dishes.map((dish) => [dish.slug, dish]));

  return items.map((item) => {
    const dish = bySlug.get(item.id);
    if (!dish) {
      throw new OrderCreationError(
        `Plat introuvable : ${item.name || item.id}.`,
      );
    }
    if (!dish.available) {
      throw new OrderCreationError(
        `${dish.name} est actuellement indisponible.`,
      );
    }

    const options = normalizeLineOptions(dish, item.options ?? []);
    const optionsTotal = (options ?? []).reduce(
      (sum, option) => sum + option.priceDelta,
      0,
    );

    return {
      id: dish.slug,
      name: dish.name,
      price: roundCurrency(dish.price + optionsTotal),
      quantity: normalizeQuantity(item.quantity),
      options,
      note: normalizeNote(item.note),
    };
  });
}

/** Convertit une ligne Prisma en type métier `Order`. */
function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    restaurantId: row.restaurantId ?? undefined,
    reference: row.reference,
    createdAt: row.createdAt.toISOString(),
    status: row.status as OrderStatus,
    customer: {
      name: row.customerName,
      email: row.customerEmail,
      phone: row.customerPhone,
      address: row.customerAddress ?? undefined,
      notes: row.customerNotes ?? undefined,
    },
    items: row.items.map((i) => ({
      id: i.dishId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      options: (i.options as CartLineOption[] | null) ?? undefined,
      note: i.note ?? undefined,
    })),
    subtotal: row.subtotal,
    discount: row.discount,
    promoCode: row.promoCode ?? undefined,
    fulfillment: row.fulfillment as Fulfillment,
    deliveryFee: row.deliveryFee,
    tip: row.tip,
    scheduledAt: row.scheduledAt?.toISOString() ?? undefined,
    prepTimeMin: row.prepTimeMin,
    total: row.total,
  };
}

/** Crée une commande (statut « en attente »), applique le promo, persiste, notifie. */
export async function createOrder({
  customer,
  items,
  promoCode,
  fulfillment = "emporter",
  postalCode,
  tip = 0,
  scheduledAt,
}: CreateOrderInput): Promise<Order> {
  const restaurant = await getDefaultRestaurant();
  const normalizedItems = await normalizeOrderItems(items);
  const subtotal = roundCurrency(
    normalizedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  let discount = 0;
  let appliedCode: string | undefined;
  if (promoCode) {
    const promo = await evaluatePromo(promoCode, subtotal);
    if (promo.valid && promo.discount) {
      discount = promo.discount;
      appliedCode = promo.code;
    }
  }

  // Frais de livraison selon la zone (uniquement en mode livraison).
  let deliveryFee = 0;
  if (fulfillment === "livraison") {
    const q = await quoteDelivery(postalCode ?? "", subtotal);
    if (!q.available) {
      throw new OrderCreationError(q.reason ?? "Livraison indisponible.");
    }
    deliveryFee = q.fee;
  }

  const safeTip = Math.max(0, tip);
  const total = Math.max(0, subtotal - discount) + deliveryFee + safeTip;
  // Référence opaque : elle sert de lien de suivi et ne doit pas être devinable.
  const ref = `NK-${crypto.randomBytes(10).toString("hex").toUpperCase()}`;

  // Temps de préparation = max des temps des plats (préparés en parallèle).
  const dishes = await prisma.dish.findMany({
    where: { slug: { in: normalizedItems.map((i) => i.id) } },
    select: { prepMinutes: true },
  });
  const prepTimeMin = dishes.length
    ? Math.max(...dishes.map((d) => d.prepMinutes))
    : 20;

  // Quantité demandée par produit (un même produit peut être sur plusieurs lignes).
  const qtyBySlug = new Map<string, number>();
  for (const i of normalizedItems) {
    qtyBySlug.set(i.id, (qtyBySlug.get(i.id) ?? 0) + i.quantity);
  }

  // Décrémente le stock du jour PUIS crée la commande, de façon atomique
  // (anti-survente). Un `dailyStock` null = stock illimité → ignoré.
  const row = await prisma
    .$transaction(
      async (tx) => {
        if (appliedCode) {
          const consumed = await tx.$executeRaw`
        UPDATE "PromoCode"
        SET "usedCount" = "usedCount" + 1
        WHERE "code" = ${appliedCode}
          AND "active" = true
          AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
          AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
      `;
          if (consumed !== 1) {
            throw new OrderCreationError(
              "Ce code promotionnel vient d’être utilisé ou n’est plus disponible.",
            );
          }
        }

        const day = stockToday();
        for (const [slug, qty] of qtyBySlug) {
          const dish = await tx.dish.findUnique({
            where: { slug },
            select: {
              name: true,
              dailyStock: true,
              soldToday: true,
              stockDate: true,
            },
          });
          if (!dish || dish.dailyStock == null) continue;
          const remaining = remainingStock(dish) ?? 0;
          if (qty > remaining) {
            throw new OrderCreationError(
              remaining <= 0
                ? `${dish.name} est épuisé pour aujourd'hui.`
                : `Il ne reste que ${remaining} × ${dish.name} aujourd'hui.`,
            );
          }
          const soldBase = dish.stockDate === day ? dish.soldToday : 0;
          await tx.dish.update({
            where: { slug },
            data: { soldToday: soldBase + qty, stockDate: day },
          });
        }

        return tx.order.create({
          data: {
            reference: ref,
            status: "en attente",
            customerName: customer.name,
            customerEmail: customer.email.toLowerCase(),
            customerPhone: customer.phone,
            restaurantId: restaurant?.id,
            customerAddress: customer.address,
            customerNotes: customer.notes,
            subtotal,
            discount,
            promoCode: appliedCode,
            fulfillment,
            deliveryFee,
            tip: safeTip,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            prepTimeMin,
            total,
            events: { create: { status: "en attente", actor: "client" } },
            items: {
              create: normalizedItems.map((i) => ({
                dishId: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                options: i.options
                  ? (i.options as unknown as Prisma.InputJsonValue)
                  : undefined,
                note: i.note,
              })),
            },
          },
          include: { items: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
    .catch((error: unknown) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        throw new OrderCreationError(
          "Le stock vient de changer. Vérifiez votre panier et réessayez.",
        );
      }
      throw error;
    });

  await upsertCustomer(customer.email, {
    name: customer.name,
    phone: customer.phone,
  });
  await recordDemoLead({
    source: "commande",
    sourceId: ref,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    message: `${fulfillment} · ${normalizedItems.length} ligne(s) · ${formatPrice(total)}`,
    converted: true,
  });

  await sendEmail({
    to: customer.email,
    subject: `Confirmation de votre commande ${ref}`,
    html: safeHtml`<h1>Merci ${customer.name} !</h1>
      <p>Votre commande <strong>${rawHtml(ref)}</strong> a bien été enregistrée.</p>
      <p>Montant total : <strong>${rawHtml(formatPrice(total))}</strong></p>`,
  });

  // Automation : confirmation par SMS.
  const siteConfig = await getSiteConfig();
  await sendSms({
    to: customer.phone,
    body: `${siteConfig.shortName} : votre commande ${ref} (${formatPrice(total)}) est bien reçue. Merci ${customer.name} !`,
  });

  return toOrder(row);
}

/** Retourne une commande par référence. */
export async function getOrderByReference(
  reference: string,
): Promise<Order | undefined> {
  const row = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });
  return row ? toOrder(row) : undefined;
}

/** Retourne toutes les commandes (back-office), plus récentes d'abord. */
export async function getAllOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

/** Retourne les commandes d'un email (espace client), plus récentes d'abord. */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { customerEmail: email.toLowerCase() },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

/** Met à jour le statut d'une commande et journalise l'événement (audit). */
export async function updateOrderStatus(
  reference: string,
  status: OrderStatus,
  actor = "système",
): Promise<Order | undefined> {
  try {
    const row = await prisma.order.update({
      where: { reference },
      data: {
        status,
        events: { create: { status, actor } },
      },
      include: { items: true },
    });
    // Attribution des points de fidélité au paiement (idempotent).
    if (status === "payée") await awardPointsForOrder(reference);

    // Automation : notifier le client aux étapes clés.
    if (status === "prête" || status === "livrée") {
      const siteConfig = await getSiteConfig();
      const msg =
        status === "prête"
          ? `Votre commande ${reference} est prête !`
          : `Votre commande ${reference} a été livrée. Bon appétit !`;
      await sendEmail({
        to: row.customerEmail,
        subject: `${siteConfig.shortName} — commande ${reference}`,
        html: `<p>${msg}</p>`,
      });
      await sendSms({
        to: row.customerPhone,
        body: `${siteConfig.shortName} : ${msg}`,
      });
    }
    return toOrder(row);
  } catch {
    return undefined;
  }
}

/** Journal d'audit (timeline) d'une commande. */
export async function getOrderEvents(reference: string) {
  const order = await prisma.order.findUnique({
    where: { reference },
    select: { id: true },
  });
  if (!order) return [];
  return prisma.orderEvent.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "asc" },
  });
}
