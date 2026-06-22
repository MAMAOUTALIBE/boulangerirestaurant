import "server-only";
import { prisma } from "@/lib/prisma";

/** 1 point par euro dépensé (sur le total payé). */
export function pointsForAmount(total: number): number {
  return Math.floor(total);
}

export type Tier = "Bronze" | "Argent" | "Or" | "Platine";

/** Palier de fidélité selon le total de points. */
export function tierForPoints(points: number): Tier {
  if (points >= 500) return "Platine";
  if (points >= 200) return "Or";
  if (points >= 50) return "Argent";
  return "Bronze";
}

export const tierStyles: Record<Tier, string> = {
  Bronze: "bg-orange-900/30 text-orange-300",
  Argent: "bg-white/10 text-cream",
  Or: "bg-gold/20 text-gold",
  Platine: "bg-purple-500/15 text-purple-300",
};

/** Conversion : 100 points = 5 € de remise. */
export const POINTS_PER_REDEMPTION = 100;
export const REDEMPTION_VALUE_EUR = 5;

/**
 * Attribue les points d'une commande à son client, une seule fois.
 * Idempotent grâce au drapeau `pointsAwarded`.
 */
export async function awardPointsForOrder(reference: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order || order.pointsAwarded) return;

  const points = pointsForAmount(order.total);
  await prisma.$transaction([
    prisma.order.update({
      where: { reference },
      data: { pointsAwarded: true },
    }),
    prisma.customer.update({
      where: { email: order.customerEmail },
      data: { loyaltyPoints: { increment: points } },
    }),
  ]);
}
