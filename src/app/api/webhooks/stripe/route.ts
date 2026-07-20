import { NextResponse } from "next/server";
import { updateOrderStatus, getOrderByReference } from "@/lib/orders";
import { isExpectedStripePayment } from "@/lib/payment-integrity";
import { getSiteConfig } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";

// Le webhook a besoin du corps brut (raw body) pour vérifier la signature.
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * Confirme le paiement côté serveur (source de vérité), indépendamment de la
 * redirection navigateur. Active uniquement si Stripe est configuré.
 */
export async function POST(request: Request) {
  const siteConfig = await getSiteConfig();
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

  // Idempotence forte : on enregistre l'event.id AVANT tout traitement. La clé
  // primaire garantit un traitement au plus une fois même en cas de rejeu ou de
  // double livraison concurrente (course que le seul garde de statut ne couvre pas).
  try {
    await prisma.processedStripeEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch {
    // Déjà traité (violation de clé primaire) → on accuse réception sans rejouer.
    return NextResponse.json({ received: true, deduped: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data
        .object as import("stripe").Stripe.Checkout.Session;
      const reference = session.client_reference_id;
      if (reference) {
        const order = await getOrderByReference(reference);
        // Idempotence : on ne confirme le paiement que si la commande est encore
        // en attente, pour ne pas régresser une commande déjà avancée (replay du webhook).
        const paymentIsValid =
          order &&
          isExpectedStripePayment(
            {
              amountTotal: session.amount_total,
              currency: session.currency,
              paymentStatus: session.payment_status,
            },
            order.total,
            siteConfig.currency,
          );
        if (order && !paymentIsValid) {
          console.error("[stripe:webhook] paiement incohérent refusé", {
            reference,
            amountTotal: session.amount_total,
            currency: session.currency,
            paymentStatus: session.payment_status,
          });
        }
        if (order && paymentIsValid && order.status === "en attente") {
          await updateOrderStatus(reference, "payée");
        }
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data
        .object as import("stripe").Stripe.Checkout.Session;
      const reference = session.client_reference_id;
      if (reference) {
        const order = await getOrderByReference(reference);
        // On n'annule que si la commande n'a pas déjà été payée/avancée.
        if (order && order.status === "en attente") {
          await updateOrderStatus(reference, "annulée");
        }
      }
      break;
    }
    default:
      // Autres événements ignorés.
      break;
  }

  return NextResponse.json({ received: true });
}
