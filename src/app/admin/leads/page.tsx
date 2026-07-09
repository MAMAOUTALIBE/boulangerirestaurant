import {
  DEMO_LEAD_SOURCES,
  demoLeadSourceLabels,
  listDemoLeads,
  type DemoLeadSource,
} from "@/lib/demo-leads";

export const dynamic = "force-dynamic";

function sourceLabel(source: string): string {
  return DEMO_LEAD_SOURCES.includes(source as DemoLeadSource)
    ? demoLeadSourceLabels[source as DemoLeadSource]
    : source;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const { q, source } = await searchParams;
  const leads = await listDemoLeads({ q, source });
  const withPhone = leads.filter((lead) => lead.phone).length;
  const withEmail = leads.filter((lead) => lead.email).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">
            Leads tests
          </h1>
          <p className="mt-1 text-sm text-muted">
            Coordonnées saisies pendant les démonstrations et tests du site.
          </p>
        </div>
        <a
          href="/api/admin/leads.csv"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-cream transition hover:border-gold/60 hover:text-gold"
        >
          Exporter CSV
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Contacts" value={String(leads.length)} />
        <Kpi label="Avec téléphone" value={String(withPhone)} />
        <Kpi label="Avec email" value={String(withEmail)} />
      </div>

      <form className="flex flex-wrap gap-3" action="/admin/leads">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Nom, email, téléphone…"
          className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-ink-soft px-4 py-2.5 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
        <select
          name="source"
          defaultValue={source ?? ""}
          className="rounded-xl border border-white/10 bg-ink-soft px-4 py-2.5 text-sm text-cream focus:border-gold/60 focus:outline-none"
        >
          <option value="">Toutes les sources</option>
          {DEMO_LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {demoLeadSourceLabels[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary px-5">
          Filtrer
        </button>
      </form>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucun lead test pour le moment.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-ink-soft text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Dernier test</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leads.map((lead) => (
                <tr key={lead.id} className="text-cream/90">
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.name || "—"}</p>
                    <p className="text-xs text-muted">
                      {lead.visits} passage{lead.visits > 1 ? "s" : ""}
                      {lead.converted ? " · commande créée" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone.replace(/\s/g, "")}`}
                        className="text-gold hover:underline"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="break-all text-gold hover:underline"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-gold">
                      {sourceLabel(lead.source)}
                    </span>
                    {lead.sourceId && (
                      <div className="mt-1 font-mono text-xs text-muted">
                        {lead.sourceId}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {lead.lastSeenAt.toLocaleString("fr-FR")}
                  </td>
                  <td className="max-w-[18rem] px-4 py-3 text-muted">
                    {lead.message || "—"}
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
