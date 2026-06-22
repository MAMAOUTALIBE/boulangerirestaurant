import "server-only";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrdersByEmail } from "@/lib/orders";
import type { Order } from "@/types";
import { computeSegment, daysSince, type Segment } from "@/lib/segmentation";
import { getDefaultRestaurant } from "@/lib/restaurants";

type CustomerWriteMode = "prisma" | "legacy-composite";
let customerWriteMode: CustomerWriteMode | null = null;

async function resolveCustomerWriteMode(): Promise<CustomerWriteMode> {
  if (customerWriteMode) return customerWriteMode;
  try {
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND tablename = 'Customer'
    `;
    customerWriteMode = indexes.some(
      (row) => row.indexname === "Customer_restaurantId_email_key",
    )
      ? "legacy-composite"
      : "prisma";
  } catch {
    customerWriteMode = "prisma";
  }
  return customerWriteMode;
}

async function upsertCustomerLegacyComposite(
  email: string,
  data: { name?: string; phone?: string },
): Promise<void> {
  const restaurant = await getDefaultRestaurant();
  if (!restaurant) return;

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "Customer"
        ("id","restaurantId","email","name","phone","notes","tags","loyaltyPoints","createdAt","updatedAt")
      VALUES
        ($1,$2,$3,$4,$5,'',ARRAY[]::text[],0,NOW(),NOW())
      ON CONFLICT ("restaurantId","email")
      DO UPDATE SET
        "name" = COALESCE(EXCLUDED."name","Customer"."name"),
        "phone" = COALESCE(EXCLUDED."phone","Customer"."phone"),
        "updatedAt" = NOW()
    `,
    crypto.randomUUID(),
    restaurant.id,
    email,
    data.name ?? null,
    data.phone ?? null,
  );
}

/**
 * Crée ou met à jour la fiche client (consolidation par email).
 * Appelé à chaque commande / réservation / demande traiteur.
 */
export async function upsertCustomer(
  email: string,
  data: { name?: string; phone?: string },
): Promise<void> {
  const normalized = email.toLowerCase();
  const mode = await resolveCustomerWriteMode();
  if (mode === "legacy-composite") {
    await upsertCustomerLegacyComposite(normalized, data);
    return;
  }

  await prisma.customer.upsert({
    where: { email: normalized },
    // On ne met à jour nom/téléphone que s'ils sont fournis.
    update: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
    },
    create: { email: normalized, name: data.name, phone: data.phone },
  });
}

export interface CustomerSummary {
  email: string;
  name: string | null;
  tags: string[];
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  daysSinceLastOrder: number | null;
  segment: Segment;
}

/** Liste des clients avec agrégats RFM + segment (recherche/segment optionnels). */
export async function listCustomers(
  search?: string,
  segment?: string,
): Promise<CustomerSummary[]> {
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  // Agrégats de commandes par email (payées + en attente comptent dans le total).
  const grouped = await prisma.order.groupBy({
    by: ["customerEmail"],
    _count: { _all: true },
    _sum: { total: true },
    _max: { createdAt: true },
  });
  const byEmail = new Map(grouped.map((g) => [g.customerEmail, g]));
  const now = Date.now();

  const summaries = customers.map((c): CustomerSummary => {
    const g = byEmail.get(c.email);
    const ordersCount = g?._count._all ?? 0;
    const totalSpent = g?._sum.total ?? 0;
    const lastOrderAt = g?._max.createdAt?.toISOString() ?? null;
    const daysSinceLastOrder = daysSince(lastOrderAt, now);
    return {
      email: c.email,
      name: c.name,
      tags: c.tags,
      ordersCount,
      totalSpent,
      lastOrderAt,
      daysSinceLastOrder,
      segment: computeSegment({ ordersCount, totalSpent, daysSinceLastOrder }),
    };
  });

  return segment ? summaries.filter((s) => s.segment === segment) : summaries;
}

export interface CustomerDetail {
  customer: Customer | null;
  email: string;
  orders: Order[];
  reservations: {
    id: string;
    reference: string;
    date: string;
    time: string;
    guests: number;
    status: string;
  }[];
  cateringCount: number;
  newsletter: boolean;
  ltv: number;
  averageBasket: number;
}

/** Fiche client 360° : agrège commandes, réservations, traiteur, newsletter. */
export async function getCustomerDetail(
  email: string,
): Promise<CustomerDetail> {
  const normalized = email.toLowerCase();
  const [customer, orders, reservations, cateringCount, newsletter] =
    await Promise.all([
      prisma.customer.findUnique({ where: { email: normalized } }),
      getOrdersByEmail(normalized),
      prisma.reservation.findMany({
        where: { email: normalized },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cateringRequest.count({ where: { email: normalized } }),
      prisma.newsletterSubscriber.findUnique({ where: { email: normalized } }),
    ]);

  const paid = orders.filter((o) => o.status === "payée");
  const ltv = paid.reduce((s, o) => s + o.total, 0);
  const averageBasket = paid.length ? ltv / paid.length : 0;

  return {
    customer,
    email: normalized,
    orders,
    reservations: reservations.map((r) => ({
      id: r.id,
      reference: r.reference,
      date: r.date,
      time: r.time,
      guests: r.guests,
      status: r.status,
    })),
    cateringCount,
    newsletter: Boolean(newsletter),
    ltv,
    averageBasket,
  };
}

/** Met à jour les champs CRM (notes + tags) d'un client. */
export async function updateCustomerCrm(
  email: string,
  notes: string,
  tags: string[],
): Promise<void> {
  const normalized = email.toLowerCase();
  await prisma.customer.upsert({
    where: { email: normalized },
    update: { notes, tags },
    create: { email: normalized, notes, tags },
  });
}
