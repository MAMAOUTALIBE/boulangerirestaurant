import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getOrderByReference } from "@/lib/orders";
import { getSessionEmail, isAdminSession } from "@/lib/session";
import { payOrder } from "@/app/actions";
import { formatPrice } from "@/lib/utils";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderStatusNotifier } from "@/components/OrderStatusNotifier";
import type { OrderStatus } from "@/types";
import { getOrderingMode } from "@/lib/online-ordering";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ paid?: string; payment?: string }>;
}

// Étapes de suivi selon le mode (livraison ajoute « en livraison »).
function trackSteps(delivery: boolean): OrderStatus[] {
  return delivery
    ? ["payée", "en préparation", "prête", "en livraison", "livrée"]
    : ["payée", "en préparation", "prête", "livrée"];
}
const STEP_LABEL: Record<string, string> = {
  payée: "Confirmée",
  "en préparation": "En préparation",
  prête: "Prête",
  "en livraison": "En livraison",
  livrée: "Livrée",
};

export default async function OrderPage({ params, searchParams }: PageProps) {
  const [{ reference }, { paid, payment }] = await Promise.all([
    params,
    searchParams,
  ]);
  const [order, orderingMode] = await Promise.all([
    getOrderByReference(reference),
    getOrderingMode(),
  ]);
  if (!order) notFound();

  // Un utilisateur connecté ne peut consulter que sa propre commande (ou admin) ;
  // un invité reste autorisé via la référence-capacité (80 bits) après checkout.
  const sessionEmail = await getSessionEmail();
  if (
    sessionEmail &&
    sessionEmail.toLowerCase() !== order.customer.email.toLowerCase() &&
    !(await isAdminSession())
  ) {
    notFound();
  }

  // Seul le statut confirmé par le webhook Stripe fait foi.
  const isPaid = order.status !== "en attente";
  const paymentPending = paid === "1" && order.status === "en attente";
  const steps = trackSteps(order.fulfillment === "livraison");
  const currentIdx = steps.indexOf(order.status as OrderStatus);

  // ETA : créneau choisi sinon création + temps de préparation.
  const eta = order.scheduledAt
    ? new Date(order.scheduledAt)
    : new Date(new Date(order.createdAt).getTime() + order.prepTimeMin * 60000);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-ink pb-20 pt-28">
        {/* Rafraîchit le suivi tant que la commande n'est pas terminée. */}
        {(isPaid || paymentPending) &&
          order.status !== "livrée" &&
          order.status !== "annulée" && <AutoRefresh seconds={20} />}
        <div className="container-page max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>

          <div className="mt-6 rounded-2xl border border-white/10 bg-ink-soft p-8">
            {payment === "unavailable" && (
              <p
                role="alert"
                className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
              >
                Le paiement en ligne est temporairement indisponible. Votre
                commande reste enregistrée et non payée.
              </p>
            )}
            {paymentPending && (
              <p
                role="status"
                className="mb-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold"
              >
                Paiement reçu par Stripe, confirmation en cours. Cette page se
                met à jour automatiquement.
              </p>
            )}
            <h1 className="font-display text-2xl font-bold text-cream">
              {isPaid ? "Merci, commande confirmée !" : "Commande enregistrée"}
            </h1>
            <p className="text-sm text-muted">
              Réf.{" "}
              <span className="font-mono text-gold">{order.reference}</span> ·{" "}
              {order.fulfillment === "livraison"
                ? "Livraison"
                : order.fulfillment === "surplace"
                  ? "Sur place"
                  : "À emporter"}
            </p>

            {/* Suivi en temps réel */}
            {isPaid && order.status !== "annulée" && (
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  {steps.map((s, i) => (
                    <div
                      key={s}
                      className="flex flex-1 flex-col items-center gap-1.5"
                    >
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-full text-xs ${
                          i <= currentIdx
                            ? "bg-gold text-ink"
                            : "bg-white/10 text-muted"
                        }`}
                      >
                        {i <= currentIdx ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={`text-center text-[10px] ${i <= currentIdx ? "text-cream" : "text-muted"}`}
                      >
                        {STEP_LABEL[s]}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-center text-sm text-cream/80">
                  {order.status === "livrée"
                    ? "Commande livrée. Bon appétit ! 🍲"
                    : `Estimation : ${eta.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                </p>
                {order.status !== "livrée" && (
                  <div className="text-center">
                    <OrderStatusNotifier
                      reference={order.reference}
                      initialStatus={order.status}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Lignes */}
            <ul className="mt-6 divide-y divide-white/10 border-y border-white/10 py-2">
              {order.items.map((item) => (
                <li key={item.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-cream/85">
                      {item.quantity} × {item.name}
                    </span>
                    <span className="text-cream">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                  {item.options && item.options.length > 0 && (
                    <p className="text-xs text-muted">
                      {item.options.map((o) => o.label).join(", ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-xs italic text-muted">« {item.note} »</p>
                  )}
                </li>
              ))}
            </ul>

            {/* Totaux */}
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-cream/70">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>
                    Remise {order.promoCode ? `(${order.promoCode})` : ""}
                  </span>
                  <span>− {formatPrice(order.discount)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-cream/70">
                  <span>Livraison</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              {order.tip > 0 && (
                <div className="flex justify-between text-cream/70">
                  <span>Pourboire</span>
                  <span>{formatPrice(order.tip)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 font-display text-lg font-bold text-gold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            {!isPaid &&
              !paymentPending &&
              orderingMode === "paiement_en_ligne" && (
                <form
                  action={payOrder.bind(null, order.reference)}
                  className="mt-8"
                >
                  <button type="submit" className="btn-primary w-full">
                    Payer maintenant — {formatPrice(order.total)}
                  </button>
                  <p className="mt-2 text-center text-xs text-muted">
                    Paiement sécurisé via Stripe. (Mode démo si aucune clé
                    configurée.)
                  </p>
                </form>
              )}
            {!isPaid && orderingMode !== "paiement_en_ligne" && (
              <p className="mt-8 rounded-xl border border-gold/30 bg-gold/5 p-4 text-center text-sm leading-6 text-cream/75">
                {orderingMode === "paiement_sur_place"
                  ? "Commande bien transmise. Vous paierez directement au restaurant, sur place ou au retrait."
                  : "Le paiement en ligne est temporairement désactivé. Cette commande historique reste consultable, mais aucun paiement ne peut être lancé."}
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
