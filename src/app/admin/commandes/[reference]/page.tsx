import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrderByReference, getOrderEvents } from "@/lib/orders";
import { adminSetOrderStatus } from "@/app/actions";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = [
  "en attente",
  "payée",
  "en préparation",
  "prête",
  "en livraison",
  "livrée",
  "annulée",
];

const statusStyles: Record<string, string> = {
  payée: "bg-green-500/15 text-green-300",
  "en attente": "bg-gold/15 text-gold",
  "en préparation": "bg-blue-500/15 text-blue-300",
  prête: "bg-purple-500/15 text-purple-300",
  "en livraison": "bg-cyan-500/15 text-cyan-300",
  livrée: "bg-green-600/20 text-green-300",
  annulée: "bg-red-500/15 text-red-300",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order) notFound();
  const events = await getOrderEvents(reference);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/commandes"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Toutes les commandes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">
            <span className="font-mono text-gold">{order.reference}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {new Date(order.createdAt).toLocaleString("fr-FR")} ·{" "}
            {order.fulfillment === "livraison"
              ? "🛵 Livraison"
              : order.fulfillment === "surplace"
                ? "🍽️ Sur place"
                : "🛍️ À emporter"}
            {order.scheduledAt
              ? ` · créneau ${new Date(order.scheduledAt).toLocaleString("fr-FR")}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/admin/commandes/${order.reference}/ticket`}
            target="_blank"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-cream transition hover:border-gold/60 hover:text-gold"
          >
            🖨️ Ticket cuisine
          </a>
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              statusStyles[order.status] ?? "bg-white/10"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Détails */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
            <h2 className="font-display text-lg font-semibold text-cream">
              Articles
            </h2>
            <ul className="mt-3 divide-y divide-white/10">
              {order.items.map((i) => (
                <li key={i.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-cream/90">
                      {i.quantity} × {i.name}
                    </span>
                    <span className="text-cream">
                      {formatPrice(i.price * i.quantity)}
                    </span>
                  </div>
                  {i.options && i.options.length > 0 && (
                    <p className="text-xs text-muted">
                      {i.options.map((o) => o.label).join(", ")}
                    </p>
                  )}
                  {i.note && (
                    <p className="text-xs italic text-muted">« {i.note} »</p>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">
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
              <div className="flex justify-between font-display text-lg font-bold text-gold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
            <h2 className="font-display text-lg font-semibold text-cream">
              Client
            </h2>
            <div className="mt-3 space-y-1 text-sm text-cream/85">
              <Link
                href={`/admin/clients/${encodeURIComponent(order.customer.email)}`}
                className="font-medium text-gold hover:underline"
              >
                {order.customer.name}
              </Link>
              <p>{order.customer.email}</p>
              <p>{order.customer.phone}</p>
              {order.customer.address && <p>{order.customer.address}</p>}
              {order.customer.notes && (
                <p className="text-muted">Note : {order.customer.notes}</p>
              )}
            </div>
          </section>
        </div>

        {/* Workflow + timeline */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
            <h2 className="font-display text-lg font-semibold text-cream">
              Statut
            </h2>
            <form action={adminSetOrderStatus} className="mt-3 space-y-2">
              <input type="hidden" name="reference" value={order.reference} />
              <input
                type="hidden"
                name="back"
                value={`/admin/commandes/${order.reference}`}
              />
              <label htmlFor="status" className="sr-only">
                Nouveau statut
              </label>
              <select
                id="status"
                name="status"
                defaultValue={order.status}
                className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary w-full">
                Mettre à jour
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
            <h2 className="font-display text-lg font-semibold text-cream">
              Historique
            </h2>
            {events.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Aucun événement.</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l border-white/10 pl-4">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gold" />
                    <p className="text-sm font-medium text-cream">{e.status}</p>
                    <p className="text-xs text-muted">
                      {new Date(e.createdAt).toLocaleString("fr-FR")}
                      {e.actor ? ` · ${e.actor}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
