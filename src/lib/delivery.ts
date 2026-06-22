import "server-only";
import { prisma } from "@/lib/prisma";

export interface DeliveryQuote {
  available: boolean;
  fee: number;
  minOrder: number;
  reason?: string;
}

/** Évalue la livraison pour un code postal et un sous-total donnés. */
export async function quoteDelivery(
  postalCode: string,
  subtotal: number,
): Promise<DeliveryQuote> {
  const zone = await prisma.deliveryZone.findUnique({
    where: { postalCode: postalCode.trim() },
  });
  if (!zone) {
    return {
      available: false,
      fee: 0,
      minOrder: 0,
      reason: "Zone non desservie.",
    };
  }
  if (subtotal < zone.minOrder) {
    return {
      available: false,
      fee: zone.fee,
      minOrder: zone.minOrder,
      reason: `Minimum de commande : ${zone.minOrder.toFixed(2)} €`,
    };
  }
  return { available: true, fee: zone.fee, minOrder: zone.minOrder };
}
