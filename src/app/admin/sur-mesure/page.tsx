import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { adminSetCustomQuoteStatus } from "@/app/actions";

export const dynamic = "force-dynamic";

const STATUSES = [
  "nouveau",
  "devis envoyé",
  "confirmé",
  "prêt",
  "récupéré",
  "annulé",
];
const statusStyles: Record<string, string> = {
  nouveau: "bg-gold/15 text-gold",
  "devis envoyé": "bg-blue-500/15 text-blue-300",
  confirmé: "bg-forest/30 text-green-200",
  prêt: "bg-green-500/15 text-green-300",
  récupéré: "bg-white/10 text-cream/70",
  annulé: "bg-red-500/15 text-red-300",
};

export default async function AdminSurMesurePage() {
  const requests = await prisma.customRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = STATUSES.map((s) => ({
    status: s,
    count: requests.filter((r) => r.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-cream">
        Demandes sur-mesure
      </h1>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counts.map((c) => (
          <div
            key={c.status}
            className="rounded-2xl border border-white/10 bg-ink-soft p-4"
          >
            <p className="text-xs uppercase tracking-wide text-muted">
              {c.status}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-cream">
              {c.count}
            </p>
          </div>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucune demande sur-mesure.
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-white/10 bg-ink-soft p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/admin/clients/${encodeURIComponent(c.email)}`}
                  className="font-medium text-cream hover:text-gold"
                >
                  {c.name}
                </Link>
                <span className="text-sm text-muted">
                  {c.occasion} · {c.servings} parts · retrait {c.pickupDate}
                  {c.pickupTime ? ` à ${c.pickupTime}` : ""}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusStyles[c.status] ?? "bg-white/10"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-cream/80">{c.details}</p>

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-2">
                <div>
                  <span className="text-cream/60">Préférences :</span>{" "}
                  {c.preferences}
                </div>
                {c.message && (
                  <div>
                    <span className="text-cream/60">Message :</span> “
                    {c.message}”
                  </div>
                )}
                {c.budget && (
                  <div>
                    <span className="text-cream/60">Budget :</span> {c.budget}
                  </div>
                )}
                {c.allergies && (
                  <div>
                    <span className="text-cream/60">Allergies :</span>{" "}
                    {c.allergies}
                  </div>
                )}
                {c.inspirationUrl && (
                  <div className="sm:col-span-2">
                    <span className="text-cream/60">Inspiration :</span>{" "}
                    <a
                      href={c.inspirationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline"
                    >
                      voir la photo
                    </a>
                  </div>
                )}
              </dl>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted">
                  {c.reference} · {c.email} · {c.phone}
                </span>
                <form
                  action={adminSetCustomQuoteStatus}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={c.id} />
                  <label htmlFor={`gs-${c.id}`} className="sr-only">
                    Statut
                  </label>
                  <select
                    id={`gs-${c.id}`}
                    name="status"
                    defaultValue={c.status}
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
