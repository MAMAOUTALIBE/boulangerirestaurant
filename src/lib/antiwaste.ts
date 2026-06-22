import "server-only";
import type { AntiWasteOffer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stockToday } from "@/lib/stock";

/** Erreur métier d'une réservation anti-gaspi (message présentable au client). */
export class AntiWasteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AntiWasteError";
  }
}

export interface AntiWasteOfferView {
  id: string;
  title: string;
  description: string;
  price: number;
  originalValue: number | null;
  pickupStart: string;
  pickupEnd: string;
  remaining: number;
  soldOut: boolean;
}

function toView(o: AntiWasteOffer): AntiWasteOfferView {
  const remaining = Math.max(0, o.quantity - o.sold);
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    price: o.price,
    originalValue: o.originalValue,
    pickupStart: o.pickupStart,
    pickupEnd: o.pickupEnd,
    remaining,
    soldOut: remaining <= 0,
  };
}

/** Offre anti-gaspi du jour (active), ou null. */
export async function getTodayAntiWasteOffer(): Promise<AntiWasteOfferView | null> {
  const offer = await prisma.antiWasteOffer.findUnique({
    where: { date: stockToday() },
  });
  if (!offer || !offer.active) return null;
  return toView(offer);
}

/** Offres anti-gaspi récentes (back-office). */
export async function getRecentAntiWasteOffers(): Promise<AntiWasteOffer[]> {
  return prisma.antiWasteOffer.findMany({
    orderBy: { date: "desc" },
    take: 30,
  });
}

interface CreateReservationInput {
  quantity: number;
  customer: { name: string; email: string; phone: string };
}

/**
 * Réserve des paniers anti-gaspi du jour : vérifie l'offre et le stock, puis
 * décrémente et persiste, de façon atomique (anti-survente).
 */
export async function createAntiWasteReservation(
  input: CreateReservationInput,
) {
  const offer = await prisma.antiWasteOffer.findUnique({
    where: { date: stockToday() },
  });
  if (!offer || !offer.active) {
    throw new AntiWasteError("Aucun panier anti-gaspi disponible ce soir.");
  }

  const reference = `AG-${Date.now().toString(36).toUpperCase()}`;
  const reservation = await prisma.$transaction(async (tx) => {
    const fresh = await tx.antiWasteOffer.findUnique({
      where: { id: offer.id },
      select: { quantity: true, sold: true },
    });
    if (!fresh) throw new AntiWasteError("Offre introuvable.");
    const remaining = fresh.quantity - fresh.sold;
    if (input.quantity > remaining) {
      throw new AntiWasteError(
        remaining <= 0
          ? "Tous les paniers de ce soir sont réservés."
          : `Il ne reste que ${remaining} panier(s) ce soir.`,
      );
    }
    await tx.antiWasteOffer.update({
      where: { id: offer.id },
      data: { sold: fresh.sold + input.quantity },
    });
    return tx.antiWasteReservation.create({
      data: {
        reference,
        offerId: offer.id,
        quantity: input.quantity,
        name: input.customer.name,
        email: input.customer.email.toLowerCase(),
        phone: input.customer.phone,
      },
    });
  });

  return { reservation, offer };
}
