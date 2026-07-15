import { listSiteTesters } from "@/lib/testers";
import {
  STAGE_LABELS,
  TESTER_STAGES,
  type TesterProfile,
  type TesterStage,
} from "@/lib/site-activity";

export const dynamic = "force-dynamic";

const STAGE_BADGE: Record<TesterStage, string> = {
  contact: "bg-white/10 text-cream/70",
  panier: "bg-gold/15 text-gold",
  commande: "bg-emerald-500/15 text-emerald-300",
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function identity(p: TesterProfile): string {
  return p.name || p.email || p.phone || "Visiteur anonyme";
}

export default async function AdminTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  const { q, stage } = await searchParams;
  const testers = await listSiteTesters({ q, stage });

  const ordered = testers.filter((t) => t.stage === "commande").length;
  const abandoned = testers.filter((t) => t.stage === "panier").length;
  const anonymous = testers.filter((t) => t.anonymous).length;

  const csvHref = `/api/admin/tests.csv${
    q || stage
      ? `?${new URLSearchParams({
          ...(q ? { q } : {}),
          ...(stage ? { stage } : {}),
        }).toString()}`
      : ""
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">
            Qui teste le site
          </h1>
          <p className="mt-1 text-sm text-muted">
            Toutes les interactions regroupées par personne : contacts, paniers
            non finalisés et commandes de tous statuts (démos incluses). Rien
            n&apos;est supprimé.
          </p>
        </div>
        <a
          href={csvHref}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-cream transition hover:border-gold/60 hover:text-gold"
        >
          Exporter CSV
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Testeurs" value={String(testers.length)} />
        <Kpi label="Ont commandé" value={String(ordered)} />
        <Kpi label="Paniers abandonnés" value={String(abandoned)} />
        <Kpi label="Anonymes" value={String(anonymous)} />
      </div>

      <form className="flex flex-wrap gap-3" action="/admin/tests">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Nom, email, téléphone, référence…"
          className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-ink-soft px-4 py-2.5 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
        <select
          name="stage"
          defaultValue={stage ?? ""}
          className="rounded-xl border border-white/10 bg-ink-soft px-4 py-2.5 text-sm text-cream focus:border-gold/60 focus:outline-none"
        >
          <option value="">Toutes les étapes</option>
          {TESTER_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary px-5">
          Filtrer
        </button>
      </form>

      {testers.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucune interaction pour le moment.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-ink-soft text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Testeur</th>
                <th className="px-4 py-3 font-medium">Étape</th>
                <th className="px-4 py-3 font-medium">Canaux testés</th>
                <th className="px-4 py-3 font-medium">Commandes</th>
                <th className="px-4 py-3 font-medium">Passages</th>
                <th className="px-4 py-3 font-medium">
                  Première / Dernière activité
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {testers.map((t) => (
                <tr key={t.key} className="align-top text-cream/90">
                  <td className="px-4 py-3">
                    <p className="font-medium">{identity(t)}</p>
                    {t.email && (
                      <a
                        href={`mailto:${t.email}`}
                        className="block break-all text-xs text-gold hover:underline"
                      >
                        {t.email}
                      </a>
                    )}
                    {t.phone && (
                      <a
                        href={`tel:${t.phone.replace(/\s/g, "")}`}
                        className="block text-xs text-gold hover:underline"
                      >
                        {t.phone}
                      </a>
                    )}
                    {t.anonymous && (
                      <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-muted">
                        Anonyme
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${STAGE_BADGE[t.stage]}`}
                    >
                      {STAGE_LABELS[t.stage]}
                    </span>
                    {t.lastStatus && (
                      <div className="mt-1 text-xs text-muted">
                        Dernier statut : {t.lastStatus}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[16rem] flex-wrap gap-1">
                      {t.channels.map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] text-gold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.counts.orders > 0 ? (
                      <div>
                        <p className="font-medium">
                          {t.totalOrdered.toFixed(2)} €
                        </p>
                        <p className="text-xs text-muted">
                          {t.counts.orders} cmd
                          {t.counts.ordersPending > 0 &&
                            ` · ${t.counts.ordersPending} en attente`}
                          {t.counts.ordersCanceled > 0 &&
                            ` · ${t.counts.ordersCanceled} annulée${
                              t.counts.ordersCanceled > 1 ? "s" : ""
                            }`}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{t.visits}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <div>{formatDate(t.firstAt)}</div>
                    <div className="text-cream/70">{formatDate(t.lastAt)}</div>
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-cream">{value}</p>
    </div>
  );
}
