import "server-only";
import { prisma } from "@/lib/prisma";

export interface PromoResult {
  valid: boolean;
  reason?: string;
  code?: string;
  /** Montant de la remise pour le sous-total fourni. */
  discount?: number;
}

/** Valide un code promo pour un sous-total donné et calcule la remise. */
export async function evaluatePromo(
  rawCode: string,
  subtotal: number,
): Promise<PromoResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, reason: "Code vide." };

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.active) {
    return { valid: false, reason: "Code invalide." };
  }
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: "Code expiré." };
  }
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return { valid: false, reason: "Code épuisé." };
  }

  const raw =
    promo.type === "percent" ? (subtotal * promo.value) / 100 : promo.value;
  // La remise ne dépasse jamais le sous-total.
  const discount = Math.min(Math.round(raw * 100) / 100, subtotal);

  return { valid: true, code, discount };
}

/** Incrémente le compteur d'utilisation d'un code (après commande). */
export async function consumePromo(code: string): Promise<void> {
  await prisma.promoCode
    .update({
      where: { code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    })
    .catch(() => {});
}
