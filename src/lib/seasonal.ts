import "server-only";
import type { SeasonalProduct } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Erreur métier d'une précommande de saison (message présentable au client). */
export class SeasonalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeasonalError";
  }
}

export interface SeasonalProductView {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  price: number;
  pickupStart: string;
  pickupEnd: string;
  /** Date de fin de vente, formatée FR. */
  salesEndLabel: string;
  remaining: number;
  soldOut: boolean;
}

function frDate(value: string): string {
  // value = AAAA-MM-JJ → JJ/MM/AAAA (formatage léger, sans dépendance fuseau).
  const [y, m, d] = value.split("-");
  return d && m && y ? `${d}/${m}/${y}` : value;
}

function toView(p: SeasonalProduct): SeasonalProductView {
  const remaining = Math.max(0, p.quota - p.sold);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    image: p.image,
    price: p.price,
    pickupStart: p.pickupStart,
    pickupEnd: p.pickupEnd,
    salesEndLabel: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeZone: "Europe/Paris",
    }).format(p.salesEnd),
    remaining,
    soldOut: remaining <= 0,
  };
}

/** Produits de saison actuellement en vente (fenêtre ouverte + actifs). */
export async function getActiveSeasonalProducts(): Promise<
  SeasonalProductView[]
> {
  const now = new Date();
  const rows = await prisma.seasonalProduct.findMany({
    where: { active: true, salesStart: { lte: now }, salesEnd: { gte: now } },
    orderBy: [{ sortOrder: "asc" }, { salesEnd: "asc" }],
  });
  return rows.map(toView);
}

/** Toutes les offres de saison (back-office). */
export async function getAllSeasonalProducts(): Promise<SeasonalProduct[]> {
  return prisma.seasonalProduct.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

interface CreatePreorderInput {
  slug: string;
  quantity: number;
  customer: { name: string; email: string; phone: string };
  pickupDate: string;
  notes?: string;
}

/**
 * Crée une précommande : vérifie la fenêtre de vente, la date de retrait et le
 * quota, puis décrémente le quota et persiste, de façon atomique (anti-survente).
 */
export async function createSeasonalPreorder(input: CreatePreorderInput) {
  const now = new Date();
  const product = await prisma.seasonalProduct.findUnique({
    where: { slug: input.slug },
  });
  if (!product || !product.active) {
    throw new SeasonalError("Ce produit de saison n'est plus disponible.");
  }
  if (now < product.salesStart) {
    throw new SeasonalError("Les précommandes ne sont pas encore ouvertes.");
  }
  if (now > product.salesEnd) {
    throw new SeasonalError("Les précommandes sont clôturées.");
  }
  if (
    input.pickupDate < product.pickupStart ||
    input.pickupDate > product.pickupEnd
  ) {
    throw new SeasonalError(
      `Le retrait doit avoir lieu entre le ${frDate(product.pickupStart)} et le ${frDate(product.pickupEnd)}.`,
    );
  }

  const reference = `SP-${Date.now().toString(36).toUpperCase()}`;
  const preorder = await prisma.$transaction(async (tx) => {
    const fresh = await tx.seasonalProduct.findUnique({
      where: { id: product.id },
      select: { quota: true, sold: true },
    });
    if (!fresh) throw new SeasonalError("Produit introuvable.");
    const remaining = fresh.quota - fresh.sold;
    if (input.quantity > remaining) {
      throw new SeasonalError(
        remaining <= 0
          ? "Ce produit est complet (quota atteint)."
          : `Il ne reste que ${remaining} unité(s) en précommande.`,
      );
    }
    await tx.seasonalProduct.update({
      where: { id: product.id },
      data: { sold: fresh.sold + input.quantity },
    });
    return tx.seasonalPreorder.create({
      data: {
        reference,
        productId: product.id,
        quantity: input.quantity,
        name: input.customer.name,
        email: input.customer.email.toLowerCase(),
        phone: input.customer.phone,
        pickupDate: input.pickupDate,
        notes: input.notes,
      },
    });
  });

  return { preorder, product };
}
