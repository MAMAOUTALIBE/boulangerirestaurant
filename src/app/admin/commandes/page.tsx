import Link from "next/link";
import { getAllOrders } from "@/lib/orders";
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

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const all = await getAllOrders();
  const { statut, q } = await searchParams;

  const orders = all.filter((o) => {
    if (statut && o.status !== statut) return false;
    if (q) {
      const needle = q.toLowerCase();
      return (
        o.reference.toLowerCase().includes(needle) ||
        o.customer.email.toLowerCase().includes(needle) ||
        o.customer.name.toLowerCase().includes(needle)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-cream">
          Commandes
        </h1>
        <a
          href="/api/admin/orders.csv"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-cream transition hover:border-gold/60 hover:text-gold"
        >
          Exporter CSV
        </a>
      </div>

      {/* Filtres */}
      <form className="flex flex-wrap gap-3" action="/admin/commandes">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Référence, nom ou email…"
          className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-ink-soft px-4 py-2.5 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
        <select
          name="statut"
          defaultValue={statut ?? ""}
          className="rounded-xl border border-white/10 bg-ink-soft px-4 py-2.5 text-sm text-cream focus:border-gold/60 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary px-5">
          Filtrer
        </button>
      </form>

      <p className="text-sm text-muted">{orders.length} commande(s)</p>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucune commande ne correspond.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-ink-soft text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Référence</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((o) => (
                <tr key={o.id} className="text-cream/90">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/commandes/${o.reference}`}
                      className="font-mono text-gold hover:underline"
                    >
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${encodeURIComponent(o.customer.email)}`}
                      className="hover:text-gold"
                    >
                      {o.customer.name}
                    </Link>
                    <div className="text-xs text-muted">{o.customer.email}</div>
                  </td>
                  <td className="px-4 py-3">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusStyles[o.status] ?? "bg-white/10"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={adminSetOrderStatus}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="hidden"
                        name="reference"
                        value={o.reference}
                      />
                      <label htmlFor={`s-${o.id}`} className="sr-only">
                        Statut de {o.reference}
                      </label>
                      <select
                        id={`s-${o.id}`}
                        name="status"
                        defaultValue={o.status}
                        className="rounded-lg border border-white/10 bg-ink px-2 py-1.5 text-xs text-cream focus:border-gold/60 focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gold-400"
                      >
                        OK
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
