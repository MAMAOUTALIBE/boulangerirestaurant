import Link from "next/link";
import { listCustomers } from "@/lib/customers";
import { formatPrice } from "@/lib/utils";
import { SEGMENTS, segmentStyles } from "@/lib/segmentation";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; segment?: string }>;
}) {
  const { q, segment } = await searchParams;
  const customers = await listCustomers(q, segment);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-cream">Clients</h1>

      <form className="flex flex-wrap gap-3" action="/admin/clients">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher par nom ou email…"
          className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-ink-soft px-4 py-2.5 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
        <select
          name="segment"
          defaultValue={segment ?? ""}
          className="rounded-xl border border-white/10 bg-ink-soft px-4 py-2.5 text-sm text-cream focus:border-gold/60 focus:outline-none"
        >
          <option value="">Tous les segments</option>
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary px-5">
          Filtrer
        </button>
      </form>

      <p className="text-sm text-muted">{customers.length} client(s)</p>

      {customers.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucun client.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-soft text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">Commandes</th>
                <th className="px-4 py-3 font-medium">Total dépensé</th>
                <th className="px-4 py-3 font-medium">Dernière</th>
                <th className="px-4 py-3 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {customers.map((c) => (
                <tr key={c.email} className="text-cream/90">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${encodeURIComponent(c.email)}`}
                      className="font-medium hover:text-gold"
                    >
                      {c.name || "—"}
                    </Link>
                    <div className="text-xs text-muted">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${segmentStyles[c.segment]}`}
                    >
                      {c.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.ordersCount}</td>
                  <td className="px-4 py-3">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.lastOrderAt
                      ? new Date(c.lastOrderAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] text-gold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
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
