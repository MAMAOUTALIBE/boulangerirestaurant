import { prisma } from "@/lib/prisma";
import {
  sendCampaign,
  adminCreatePromo,
  adminTogglePromo,
  adminDeletePromo,
} from "@/app/actions";
import { listCustomers } from "@/lib/customers";
import { SEGMENTS } from "@/lib/segmentation";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; audience?: string }>;
}) {
  const { sent, audience } = await searchParams;
  const [count, customers, promos] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    listCustomers(),
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const resendActive = Boolean(process.env.RESEND_API_KEY);
  const segCounts = SEGMENTS.map((s) => ({
    s,
    n: customers.filter((c) => c.segment === s).length,
  })).filter((x) => x.n > 0);

  // Pré-sélection si on arrive depuis « Lancer une relance » du dashboard.
  const defaultAudience = audience === "relance" ? "À risque" : "all";

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-cream">Marketing</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
          <p className="text-sm text-muted">Abonnés newsletter</p>
          <p className="mt-1 font-display text-3xl font-bold text-cream">
            {count}
          </p>
          <a
            href="/api/admin/subscribers.csv"
            className="mt-3 inline-block rounded-full border border-white/10 px-4 py-2 text-sm text-cream transition hover:border-gold/60 hover:text-gold"
          >
            Exporter CSV
          </a>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
          <p className="text-sm text-muted">Envoi des emails</p>
          <p className="mt-1 text-cream">
            {resendActive ? "✅ Resend configuré" : "⚠️ Mode simulation (logs)"}
          </p>
        </div>
      </div>

      {/* Composer une campagne */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Nouvelle campagne
        </h2>
        {sent && (
          <p role="status" className="mt-3 text-sm text-green-400">
            Campagne envoyée à {sent} destinataire(s).
          </p>
        )}
        <form action={sendCampaign} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="audience"
              className="mb-1.5 block text-sm text-cream/80"
            >
              Audience
            </label>
            <select
              id="audience"
              name="audience"
              defaultValue={defaultAudience}
              className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream focus:border-gold/60 focus:outline-none"
            >
              <option value="all">Tous les abonnés newsletter ({count})</option>
              {segCounts.map((x) => (
                <option key={x.s} value={x.s}>
                  Segment : {x.s} ({x.n})
                </option>
              ))}
            </select>
          </div>
          <input
            name="subject"
            placeholder="Sujet de l'email"
            required
            className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
          />
          <textarea
            name="body"
            rows={5}
            placeholder="Votre message…"
            required
            className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
          />
          <button type="submit" className="btn-primary">
            Envoyer la campagne
          </button>
        </form>
      </section>

      {/* Codes promo */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Codes promo
        </h2>

        <form
          action={adminCreatePromo}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input
            name="code"
            placeholder="CODE"
            required
            className="rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm uppercase text-cream focus:border-gold/60 focus:outline-none"
          />
          <select
            name="type"
            className="rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          >
            <option value="percent">% remise</option>
            <option value="fixed">€ remise</option>
          </select>
          <input
            name="value"
            type="number"
            step="0.5"
            placeholder="Valeur"
            required
            className="w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <input
            name="usageLimit"
            type="number"
            placeholder="Limite (∞)"
            className="w-28 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400"
          >
            Créer
          </button>
        </form>

        {promos.length > 0 && (
          <ul className="mt-5 divide-y divide-white/10">
            {promos.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 py-3 text-sm"
              >
                <span className="font-mono font-bold text-gold">{p.code}</span>
                <span className="text-cream/85">
                  {p.type === "percent"
                    ? `−${p.value}%`
                    : `−${formatPrice(p.value)}`}
                </span>
                <span className="text-muted">
                  utilisé {p.usedCount}
                  {p.usageLimit !== null ? `/${p.usageLimit}` : ""}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${p.active ? "bg-green-500/15 text-green-300" : "bg-white/10 text-muted"}`}
                >
                  {p.active ? "actif" : "inactif"}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <form action={adminTogglePromo}>
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={(!p.active).toString()}
                    />
                    <button
                      type="submit"
                      className="text-xs text-cream/70 hover:text-gold"
                    >
                      {p.active ? "Désactiver" : "Activer"}
                    </button>
                  </form>
                  <form action={adminDeletePromo}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Suppr.
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
