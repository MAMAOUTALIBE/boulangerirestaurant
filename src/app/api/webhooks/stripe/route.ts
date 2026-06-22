import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/orders";

// Le webhook a besoin du corps brut (raw body) pour vérifier la signature.
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * Confirme le paiement côté serveur (source de vérité), indépendamment de la
 * redirection navigateur. Active uniquement si Stripe est configuré.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe non configuré (clé ou secret webhook manquant)." },
      { status: 501 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Signature manquante." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret);

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe:webhook] signature invalide", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data
        .object as import("stripe").Stripe.Checkout.Session;
      const reference = session.client_reference_id;
      if (reference) {
        await updateOrderStatus(reference, "payée");
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data
        .object as import("stripe").Stripe.Checkout.Session;
      if (session.client_reference_id) {
        await updateOrderStatus(session.client_reference_id, "annulée");
      }
      break;
    }
    default:
      // Autres événements ignorés.
      break;
  }

  return NextResponse.json({ received: true });
}
