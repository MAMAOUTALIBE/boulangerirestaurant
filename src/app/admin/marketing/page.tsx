import { prisma } from "@/lib/prisma";
import {
  sendCampaign,
  adminCreatePromo,
  adminTogglePromo,
  adminDeletePromo,
  adminUpdateMarketingRule,
  adminRunMarketingAutomations,
} from "@/app/actions";
import { listCustomers } from "@/lib/customers";
import { SEGMENTS } from "@/lib/segmentation";
import { formatPrice } from "@/lib/utils";
import { marketingDashboard } from "@/lib/marketing-automation";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    error?: string;
    audience?: string;
    automated?: string;
    ruleSaved?: string;
    ruleError?: string;
  }>;
}) {
  const { sent, audience, automated, ruleSaved, ruleError } =
    await searchParams;
  const [count, customers, promos, automation] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    listCustomers(),
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
    marketingDashboard(),
  ]);

  const resendActive = Boolean(process.env.RESEND_API_KEY);
  const segCounts = SEGMENTS.map((s) => ({
    s,
    n: customers.filter((c) => c.segment === s).length,
  })).filter((x) => x.n > 0);

  // Pré-sélection si on arrive depuis « Lancer une relance » du dashboard.
  const defaultAudience = audience === "relance" ? "À risque" : "all";
  const totalRecipients = automation.campaigns.reduce(
    (sum, campaign) => sum + campaign.recipientCount,
    0,
  );
  const totalOrders = automation.campaigns.reduce(
    (sum, campaign) => sum + campaign.ordersCount,
    0,
  );
  const totalRevenue = automation.campaigns.reduce(
    (sum, campaign) => sum + campaign.revenue,
    0,
  );

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-cream">Marketing</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
          <p className="text-sm text-muted">Emails automatisés</p>
          <p className="mt-1 font-display text-3xl font-bold text-cream">
            {totalRecipients}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
          <p className="text-sm text-muted">CA attribué aux campagnes</p>
          <p className="mt-1 font-display text-3xl font-bold text-gold">
            {formatPrice(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted">{totalOrders} commande(s)</p>
        </div>
      </div>

      {/* Automatisations */}
      <section className="rounded-2xl border border-gold/25 bg-ink-soft p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-cream">
              Relances automatisées
            </h2>
            <p className="mt-1 text-sm text-muted">
              Les règles sont désactivées par défaut. Seuls les abonnés à la
              newsletter peuvent recevoir ces messages.
            </p>
          </div>
          <form action={adminRunMarketingAutomations}>
            <button type="submit" className="btn-primary">
              Exécuter maintenant
            </button>
          </form>
        </div>
        {automated !== undefined && (
          <p role="status" className="mt-3 text-sm text-green-400">
            Automatisations exécutées : {automated} email(s) envoyé(s).
          </p>
        )}
        {ruleSaved && (
          <p role="status" className="mt-3 text-sm text-green-400">
            Règle enregistrée.
          </p>
        )}
        {ruleError === "promo" && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            Créez et activez d’abord ce code promo dans la section « Codes promo
            » avant d’activer la règle.
          </p>
        )}
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {automation.rules.map((rule) => (
            <form
              key={rule.id}
              action={adminUpdateMarketingRule}
              className="rounded-xl border border-white/10 bg-ink p-4"
            >
              <input type="hidden" name="id" value={rule.id} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-cream">{rule.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Dernière exécution :{" "}
                    {rule.lastRunAt
                      ? rule.lastRunAt.toLocaleString("fr-FR")
                      : "jamais"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-cream/80">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={rule.enabled}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  Active
                </label>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {rule.type === "inactive" && (
                  <input
                    name="delayDays"
                    type="number"
                    min="1"
                    defaultValue={rule.delayDays ?? 30}
                    aria-label="Nombre de jours d’inactivité"
                    className="rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-sm text-cream"
                  />
                )}
                {rule.type === "weekday" && (
                  <select
                    name="weekday"
                    defaultValue={rule.weekday ?? 2}
                    aria-label="Jour de la semaine"
                    className="rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-sm text-cream"
                  >
                    {[
                      "Dimanche",
                      "Lundi",
                      "Mardi",
                      "Mercredi",
                      "Jeudi",
                      "Vendredi",
                      "Samedi",
                    ].map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  name="promoCode"
                  defaultValue={rule.promoCode ?? ""}
                  placeholder="Code promo facultatif"
                  className="rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-sm uppercase text-cream placeholder:text-muted"
                />
              </div>
              <input
                name="subject"
                required
                defaultValue={rule.subject}
                aria-label={`Sujet — ${rule.name}`}
                className="mt-2 w-full rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-sm text-cream"
              />
              <textarea
                name="body"
                required
                rows={3}
                defaultValue={rule.body}
                aria-label={`Message — ${rule.name}`}
                className="mt-2 w-full rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-sm text-cream"
              />
              <p className="mt-2 text-[11px] text-muted">
                Variables : {"{prenom}"}, {"{code}"}, {"{restaurant}"},{" "}
                {"{plat}"}, {"{meteo}"}
              </p>
              <button
                type="submit"
                className="mt-3 rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10"
              >
                Enregistrer la règle
              </button>
            </form>
          ))}
        </div>
      </section>

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
          <input
            name="promoCode"
            placeholder="Code promo pour mesurer le CA (facultatif)"
            className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm uppercase text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
          />
          <button type="submit" className="btn-primary">
            Envoyer la campagne
          </button>
        </form>
      </section>

      {/* Historique et conversions */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Performance des campagnes
        </h2>
        {automation.campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Aucune campagne enregistrée.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-3">Campagne</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Destinataires</th>
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Commandes</th>
                  <th className="pb-3 text-right">CA attribué</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {automation.campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="py-3 text-cream">{campaign.name}</td>
                    <td className="py-3 text-muted">
                      {campaign.sentAt.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 text-cream/80">
                      {campaign.recipientCount}
                    </td>
                    <td className="py-3 font-mono text-gold">
                      {campaign.promoCode ?? "—"}
                    </td>
                    <td className="py-3 text-cream/80">
                      {campaign.ordersCount}
                    </td>
                    <td className="py-3 text-right font-semibold text-cream">
                      {formatPrice(campaign.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
