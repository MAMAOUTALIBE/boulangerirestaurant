import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { adminSetReservationStatus } from "@/app/actions";

export const dynamic = "force-dynamic";

const STATUSES = ["en attente", "confirmée", "annulée"];
const statusStyles: Record<string, string> = {
  confirmée: "bg-green-500/15 text-green-300",
  "en attente": "bg-gold/15 text-gold",
  annulée: "bg-red-500/15 text-red-300",
};

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const reservations = await prisma.reservation.findMany({
    where: statut ? { status: statut } : undefined,
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 200,
  });

  // Regroupement par jour (agenda).
  const byDay = new Map<string, typeof reservations>();
  for (const r of reservations) {
    if (!byDay.has(r.date)) byDay.set(r.date, []);
    byDay.get(r.date)!.push(r);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-cream">
          Réservations
        </h1>
        <form action="/admin/reservations" className="flex gap-2">
          <select
            name="statut"
            defaultValue={statut ?? ""}
            className="rounded-xl border border-white/10 bg-ink-soft px-4 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary px-4">
            Filtrer
          </button>
        </form>
      </div>

      <p className="text-sm text-muted">{reservations.length} réservation(s)</p>

      {byDay.size === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucune réservation.
        </p>
      ) : (
        <div className="space-y-8">
          {Array.from(byDay.entries()).map(([day, list]) => (
            <div key={day}>
              <h2 className="mb-3 font-display text-lg font-semibold text-gold">
                {new Date(day).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <ul className="space-y-2">
                {list.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-ink-soft px-4 py-3 text-sm"
                  >
                    <span className="font-mono text-cream">{r.time}</span>
                    <Link
                      href={`/admin/clients/${encodeURIComponent(r.email)}`}
                      className="font-medium text-cream/90 hover:text-gold"
                    >
                      {r.name}
                    </Link>
                    <span className="text-muted">{r.guests} couv.</span>
                    <span className="text-xs text-muted">{r.phone}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusStyles[r.status] ?? "bg-white/10"
                      }`}
                    >
                      {r.status}
                    </span>
                    <form
                      action={adminSetReservationStatus}
                      className="ml-auto flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <label htmlFor={`rs-${r.id}`} className="sr-only">
                        Statut
                      </label>
                      <select
                        id={`rs-${r.id}`}
                        name="status"
                        defaultValue={r.status}
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
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
