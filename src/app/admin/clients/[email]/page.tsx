import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShoppingBag,
  CalendarCheck,
  ChefHat,
} from "lucide-react";
import { getCustomerDetail } from "@/lib/customers";
import { adminUpdateCustomer } from "@/app/actions";
import { formatPrice } from "@/lib/utils";
import { tierForPoints, tierStyles } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  payée: "bg-green-500/15 text-green-300",
  "en attente": "bg-gold/15 text-gold",
  annulée: "bg-red-500/15 text-red-300",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);
  const d = await getCustomerDetail(email);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Tous les clients
      </Link>

      {/* En-tête client */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">
            {d.customer?.name || "Client"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {d.email}
            </span>
            {d.customer?.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {d.customer.phone}
              </span>
            )}
            <span>Newsletter : {d.newsletter ? "✅ inscrit" : "—"}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(() => {
              const pts = d.customer?.loyaltyPoints ?? 0;
              const tier = tierForPoints(pts);
              return (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierStyles[tier]}`}
                >
                  ⭐ {pts} pts · {tier}
                </span>
              );
            })()}
            {d.customer?.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs text-gold"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Indicateurs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          Icon={ShoppingBag}
          label="Commandes"
          value={String(d.orders.length)}
        />
        <Stat
          Icon={CalendarCheck}
          label="Valeur client (LTV)"
          value={formatPrice(d.ltv)}
        />
        <Stat
          Icon={ChefHat}
          label="Panier moyen"
          value={formatPrice(d.averageBasket)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notes & tags (édition) */}
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-6">
          <h2 className="font-display text-lg font-semibold text-cream">
            Notes internes
          </h2>
          <form action={adminUpdateCustomer} className="mt-4 space-y-3">
            <input type="hidden" name="email" value={d.email} />
            <div>
              <label
                htmlFor="birthDate"
                className="mb-1.5 block text-sm text-cream/80"
              >
                Date d’anniversaire
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={
                  d.customer?.birthDate?.toISOString().slice(0, 10) ?? ""
                }
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream focus:border-gold/60 focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">
                Utilisée uniquement si le client accepte la newsletter.
              </p>
            </div>
            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-sm text-cream/80"
              >
                Notes (allergies, préférences…)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={d.customer?.notes ?? ""}
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream focus:border-gold/60 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="tags"
                className="mb-1.5 block text-sm text-cream/80"
              >
                Tags (séparés par des virgules)
              </label>
              <input
                id="tags"
                name="tags"
                defaultValue={d.customer?.tags.join(", ") ?? ""}
                placeholder="VIP, habitué…"
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Enregistrer
            </button>
          </form>
        </div>

        {/* Historique commandes */}
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-cream">
            Historique des commandes
          </h2>
          {d.orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucune commande.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {d.orders.map((o) => (
                <li key={o.id} className="py-3">
                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href={`/commande/${o.reference}`}
                      className="font-mono text-gold hover:underline"
                    >
                      {o.reference}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusStyles[o.status] ?? "bg-white/10"
                      }`}
                    >
                      {o.status}
                    </span>
                    <span className="text-muted">
                      {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="font-semibold text-cream">
                      {formatPrice(o.total)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {d.reservations.length > 0 && (
            <>
              <h3 className="mt-6 font-display text-base font-semibold text-cream">
                Réservations
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {d.reservations.map((r) => (
                  <li key={r.id}>
                    {r.reference} — {r.date} à {r.time} · {r.guests} pers. (
                    {r.status})
                  </li>
                ))}
              </ul>
            </>
          )}
          {d.cateringCount > 0 && (
            <p className="mt-4 text-sm text-muted">
              {d.cateringCount} demande(s) traiteur.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-cream">{value}</p>
    </div>
  );
}
