import "server-only";
import type { Order } from "@/types";
import { siteConfig } from "@/lib/config";
import { getRestaurantConnectTransferData } from "@/lib/stripe-connect";

export interface CheckoutResult {
  /** URL de redirection vers le paiement (Stripe) si disponible. */
  url?: string;
  /** Mode simulation activé (aucune clé Stripe configurée). */
  simulated: boolean;
}

/**
 * Démarre un paiement pour une commande.
 *
 * - Si `STRIPE_SECRET_KEY` est défini : crée une vraie session Stripe Checkout
 *   et retourne son URL.
 * - Sinon : mode simulation (retourne `simulated: true`, à confirmer côté app).
 */
export async function startCheckout(order: Order): Promise<CheckoutResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { simulated: true };
  }
  const transferData = await getRestaurantConnectTransferData(
    order.restaurantId,
  );

  // Import dynamique : Stripe n'est chargé que si une clé est présente.
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: siteConfig.currency.toLowerCase(),
        unit_amount: Math.round(item.price * 100),
        product_data: { name: item.name },
      },
    })),
    customer_email: order.customer.email,
    client_reference_id: order.reference,
    success_url: `${siteConfig.url}/commande/${order.reference}?paid=1`,
    cancel_url: `${siteConfig.url}/commande/${order.reference}`,
    payment_intent_data: transferData
      ? {
          transfer_data: transferData,
          on_behalf_of: transferData.destination,
        }
      : undefined,
  });

  return { url: session.url ?? undefined, simulated: false };
}
