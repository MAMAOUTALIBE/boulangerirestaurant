import { Palette, ShieldCheck, Store } from "lucide-react";
import { adminEmails } from "@/lib/auth";
import { defaultSiteConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import {
  adminUpsertZone,
  adminDeleteZone,
  adminUpdateHours,
  adminUpdateOrderingSettings,
  adminUpdateColorPalette,
  adminUpdateSiteIdentity,
  adminCreateRestaurant,
  adminCreateDriver,
  adminOpenRestaurantStripeOnboarding,
  adminSyncRestaurantStripeStatus,
  adminToggleDriver,
  adminUpdateRestaurantStripeAccount,
} from "@/app/actions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Champ de formulaire pour l'identité du restaurant (placeholder = valeur par défaut). */
function IdentityField({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
  textarea = false,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  const inputClass =
    "mt-1 block w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-cream placeholder:text-muted/60 focus:border-gold/60 focus:outline-none";
  return (
    <label className="block text-sm">
      <span className="text-cream/80">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={2}
          className={inputClass}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </label>
  );
}

export default async function AdminParametresPage() {
  const admins = adminEmails();
  const [zones, hours, setting, drivers, restaurants, identity] =
    await Promise.all([
      prisma.deliveryZone.findMany({ orderBy: { postalCode: "asc" } }),
      prisma.openingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
      prisma.orderingSetting.findUnique({ where: { id: "default" } }),
      prisma.driver.findMany({ orderBy: { name: "asc" } }),
      prisma.restaurant.findMany({
        orderBy: [{ active: "desc" }, { name: "asc" }],
      }),
      prisma.siteSetting.findUnique({ where: { id: "default" } }),
    ]);
  const stripeSecretConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const stripeConnectedRestaurants = restaurants.filter(
    (r) => r.stripeOnboardingComplete,
  ).length;
  const integrations = [
    { name: "Paiement Stripe", active: Boolean(process.env.STRIPE_SECRET_KEY) },
    {
      name: "Webhook Stripe",
      active: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    },
    {
      name: "Stripe Connect restaurants",
      active: stripeConnectedRestaurants > 0,
    },
    { name: "Emails Resend", active: Boolean(process.env.RESEND_API_KEY) },
    {
      name: "SMS / WhatsApp (Twilio)",
      active: Boolean(process.env.TWILIO_ACCOUNT_SID),
    },
    { name: "Relance auto (cron)", active: Boolean(process.env.CRON_SECRET) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-cream">Paramètres</h1>

      {/* Identité du restaurant */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-cream">
          <Store className="h-5 w-5 text-gold" />
          Identité du restaurant
        </h2>
        <p className="mt-2 text-sm text-muted">
          Personnalisez le site sans toucher au code. Un champ laissé vide
          utilise la valeur par défaut (affichée en gris). Les changements sont
          visibles immédiatement sur tout le site.
        </p>
        <form action={adminUpdateSiteIdentity} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <IdentityField
              name="name"
              label="Nom du restaurant"
              defaultValue={identity?.name ?? ""}
              placeholder={defaultSiteConfig.name}
            />
            <IdentityField
              name="shortName"
              label="Nom court (logo, notifications)"
              defaultValue={identity?.shortName ?? ""}
              placeholder={defaultSiteConfig.shortName}
            />
          </div>
          <IdentityField
            name="description"
            label="Slogan / description (SEO)"
            defaultValue={identity?.description ?? ""}
            placeholder={defaultSiteConfig.description}
            textarea
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <IdentityField
              name="phone"
              label="Téléphone"
              defaultValue={identity?.phone ?? ""}
              placeholder={defaultSiteConfig.contact.phone}
            />
            <IdentityField
              name="email"
              label="Email"
              type="email"
              defaultValue={identity?.email ?? ""}
              placeholder={defaultSiteConfig.contact.email}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <IdentityField
              name="address"
              label="Adresse (lien Google Maps auto)"
              defaultValue={identity?.address ?? ""}
              placeholder={defaultSiteConfig.contact.address}
            />
            <IdentityField
              name="city"
              label="Ville (livraison, retrait, SEO local)"
              defaultValue={identity?.city ?? ""}
              placeholder={defaultSiteConfig.contact.city}
            />
          </div>
          <IdentityField
            name="hoursSummary"
            label="Horaires (résumé affiché)"
            defaultValue={identity?.hoursSummary ?? ""}
            placeholder={defaultSiteConfig.hours.summary}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <IdentityField
              name="whatsappNumber"
              label="Numéro WhatsApp (commandes)"
              defaultValue={identity?.whatsappNumber ?? ""}
              placeholder={defaultSiteConfig.messaging.whatsappOrderNumber}
            />
            <IdentityField
              name="telegramUsername"
              label="Pseudo Telegram (commandes)"
              defaultValue={identity?.telegramUsername ?? ""}
              placeholder={defaultSiteConfig.messaging.telegramOrderUsername}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <IdentityField
              name="facebook"
              label="Facebook (URL)"
              defaultValue={identity?.facebook ?? ""}
              placeholder={defaultSiteConfig.socials.facebook}
            />
            <IdentityField
              name="instagram"
              label="Instagram (URL)"
              defaultValue={identity?.instagram ?? ""}
              placeholder={defaultSiteConfig.socials.instagram}
            />
            <IdentityField
              name="tiktok"
              label="TikTok (URL)"
              defaultValue={identity?.tiktok ?? ""}
              placeholder={defaultSiteConfig.socials.tiktok}
            />
          </div>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400">
            Enregistrer l&apos;identité
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-cream">
          <Palette className="h-5 w-5 text-gold" />
          Couleurs du site public
        </h2>
        <p className="mt-2 text-sm text-muted">
          La palette sélectionnée s’applique à tous les visiteurs. Les fonds et
          les cartes ne changent pas.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              id: "ambre",
              label: "Ambre",
              color: "#F59E0B",
              description: "Palette actuelle",
            },
            {
              id: "terracotta",
              label: "Terracotta",
              color: "#EF7045",
              description: "Chaleureux",
            },
            {
              id: "emeraude",
              label: "Émeraude",
              color: "#34D399",
              description: "Frais et élégant",
            },
          ].map(({ id, label, color, description }) => {
            const active = (setting?.colorPalette ?? "ambre") === id;
            return (
              <form key={id} action={adminUpdateColorPalette}>
                <input type="hidden" name="palette" value={id} />
                <button
                  type="submit"
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-gold bg-gold/10"
                      : "border-white/10 bg-ink hover:border-white/30"
                  }`}
                >
                  <span
                    className="h-10 w-10 shrink-0 rounded-full border-4 border-white/15"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block font-semibold text-cream">
                      {label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {description}
                    </span>
                  </span>
                </button>
              </form>
            );
          })}
        </div>
      </section>

      {/* Administrateurs */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-cream">
          <ShieldCheck className="h-5 w-5 text-gold" />
          Administrateurs
        </h2>
        <p className="mt-2 text-sm text-muted">
          Gérés via la variable d&apos;environnement{" "}
          <code className="text-gold">ADMIN_EMAILS</code>.
        </p>
        <ul className="mt-4 space-y-2">
          {admins.length === 0 ? (
            <li className="text-sm text-red-400">
              Aucun admin configuré (ADMIN_EMAILS vide).
            </li>
          ) : (
            admins.map((e) => (
              <li
                key={e}
                className="rounded-lg border border-white/10 bg-ink px-4 py-2 text-sm text-cream"
              >
                {e}
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Intégrations */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Intégrations
        </h2>
        <ul className="mt-4 space-y-2">
          {integrations.map((i) => (
            <li
              key={i.name}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-ink px-4 py-2 text-sm"
            >
              <span className="text-cream">{i.name}</span>
              <span className={i.active ? "text-green-400" : "text-muted"}>
                {i.active ? "✅ actif" : "⚠️ non configuré (simulation)"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Restaurants & Stripe Connect */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Restaurants & Stripe Connect
        </h2>
        <p className="mt-2 text-sm text-muted">
          Gérez les comptes Stripe Connect par restaurant.{" "}
          {stripeSecretConfigured
            ? `Restaurants prêts au paiement: ${stripeConnectedRestaurants}/${restaurants.length || 0}.`
            : "Ajoutez STRIPE_SECRET_KEY pour activer la connexion Stripe Connect."}
        </p>

        <ul className="mt-4 space-y-3">
          {restaurants.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-white/10 bg-ink p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-cream">{r.name}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs text-cream/80">
                  {r.slug}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.active
                      ? "bg-green-500/15 text-green-300"
                      : "bg-white/10 text-muted"
                  }`}
                >
                  {r.active ? "actif" : "inactif"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.stripeOnboardingComplete
                      ? "bg-green-500/15 text-green-300"
                      : "bg-white/10 text-cream/70"
                  }`}
                >
                  {r.stripeOnboardingComplete
                    ? "paiement prêt"
                    : r.stripeAccountId
                      ? "onboarding incomplet"
                      : "non connecté"}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-xs text-muted">
                <p>ID Connect: {r.stripeAccountId ?? "—"}</p>
                <p>
                  Paiements: {r.stripeChargesEnabled ? "oui" : "non"} · Payouts:{" "}
                  {r.stripePayoutsEnabled ? "oui" : "non"} · Détails:{" "}
                  {r.stripeDetailsSubmitted ? "soumis" : "à compléter"}
                </p>
                {r.stripeLastSyncedAt && (
                  <p>
                    Dernière synchro:{" "}
                    {r.stripeLastSyncedAt.toLocaleString("fr-FR")}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form
                  action={adminUpdateRestaurantStripeAccount}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    name="stripeAccountId"
                    defaultValue={r.stripeAccountId ?? ""}
                    placeholder="acct_..."
                    className="w-56 rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-xs text-cream focus:border-gold/60 focus:outline-none"
                  />
                  <button className="rounded-lg bg-white/10 px-3 py-2 text-xs text-cream hover:bg-white/20">
                    Enregistrer ID
                  </button>
                </form>

                <form action={adminOpenRestaurantStripeOnboarding}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-ink transition hover:bg-gold-400">
                    Ouvrir onboarding
                  </button>
                </form>

                <form action={adminSyncRestaurantStripeStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-lg bg-white/10 px-3 py-2 text-xs text-cream hover:bg-white/20">
                    Synchroniser
                  </button>
                </form>
              </div>
            </li>
          ))}
          {restaurants.length === 0 && (
            <li className="text-sm text-muted">Aucun restaurant configuré.</li>
          )}
        </ul>

        <form
          action={adminCreateRestaurant}
          className="mt-4 flex flex-wrap items-end gap-2"
        >
          <input
            name="name"
            placeholder="Nom du restaurant"
            required
            className="rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <input
            name="slug"
            placeholder="slug (optionnel)"
            className="rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400">
            Ajouter restaurant
          </button>
        </form>
      </section>

      {/* Horaires d'ouverture */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Horaires d&apos;ouverture
        </h2>
        <div className="mt-4 space-y-2">
          {hours.map((h) => (
            <form
              key={h.id}
              action={adminUpdateHours}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <input type="hidden" name="dayOfWeek" value={h.dayOfWeek} />
              <span className="w-24 text-cream/85">{DAYS[h.dayOfWeek]}</span>
              <input
                name="open"
                type="time"
                defaultValue={hhmm(h.openMinutes)}
                className="rounded-lg border border-white/10 bg-ink px-2 py-1 text-cream focus:border-gold/60 focus:outline-none"
              />
              <span className="text-muted">→</span>
              <input
                name="close"
                type="time"
                defaultValue={hhmm(h.closeMinutes)}
                className="rounded-lg border border-white/10 bg-ink px-2 py-1 text-cream focus:border-gold/60 focus:outline-none"
              />
              <label className="flex items-center gap-1 text-xs text-cream/70">
                <input
                  type="checkbox"
                  name="closed"
                  defaultChecked={h.closed}
                  className="accent-gold"
                />{" "}
                fermé
              </label>
              <button className="rounded-lg bg-white/10 px-3 py-1 text-xs text-cream hover:bg-white/20">
                OK
              </button>
            </form>
          ))}
        </div>

        <h3 className="mt-6 font-display text-base font-semibold text-cream">
          Créneaux
        </h3>
        <form
          action={adminUpdateOrderingSettings}
          className="mt-3 flex flex-wrap items-end gap-3 text-sm"
        >
          <label className="text-cream/80">
            Intervalle (min)
            <input
              name="slotIntervalMin"
              type="number"
              defaultValue={setting?.slotIntervalMin ?? 15}
              className="mt-1 block w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-cream focus:border-gold/60 focus:outline-none"
            />
          </label>
          <label className="text-cream/80">
            Délai prépa (min)
            <input
              name="leadTimeMin"
              type="number"
              defaultValue={setting?.leadTimeMin ?? 20}
              className="mt-1 block w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-cream focus:border-gold/60 focus:outline-none"
            />
          </label>
          <label className="text-cream/80">
            Capacité / créneau
            <input
              name="capacityPerSlot"
              type="number"
              defaultValue={setting?.capacityPerSlot ?? 8}
              className="mt-1 block w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-cream focus:border-gold/60 focus:outline-none"
            />
          </label>
          <label className="text-cream/80">
            Alerte imminent (min)
            <input
              name="imminentMin"
              type="number"
              defaultValue={setting?.imminentMin ?? 5}
              className="mt-1 block w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-cream focus:border-gold/60 focus:outline-none"
            />
          </label>
          <label className="text-cream/80">
            Max préparation (min)
            <input
              name="prepMaxMin"
              type="number"
              defaultValue={setting?.prepMaxMin ?? 10}
              className="mt-1 block w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-cream focus:border-gold/60 focus:outline-none"
            />
          </label>
          <label className="text-cream/80">
            Max autres colonnes (min)
            <input
              name="stageMaxMin"
              type="number"
              defaultValue={setting?.stageMaxMin ?? 5}
              className="mt-1 block w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-cream focus:border-gold/60 focus:outline-none"
            />
          </label>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400">
            Enregistrer
          </button>
        </form>
      </section>

      {/* Livreurs */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Livreurs
        </h2>
        <ul className="mt-4 space-y-2">
          {drivers.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-ink px-4 py-2 text-sm"
            >
              <span className="text-cream">{d.name}</span>
              {d.phone && <span className="text-muted">{d.phone}</span>}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${d.active ? "bg-green-500/15 text-green-300" : "bg-white/10 text-muted"}`}
              >
                {d.active ? "actif" : "inactif"}
              </span>
              <form action={adminToggleDriver} className="ml-auto">
                <input type="hidden" name="id" value={d.id} />
                <input
                  type="hidden"
                  name="active"
                  value={(!d.active).toString()}
                />
                <button className="text-xs text-cream/70 hover:text-gold">
                  {d.active ? "Désactiver" : "Activer"}
                </button>
              </form>
            </li>
          ))}
          {drivers.length === 0 && (
            <li className="text-sm text-muted">Aucun livreur.</li>
          )}
        </ul>
        <form
          action={adminCreateDriver}
          className="mt-4 flex flex-wrap items-end gap-2"
        >
          <input
            name="name"
            placeholder="Nom du livreur"
            required
            className="rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <input
            name="phone"
            placeholder="Téléphone"
            className="rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400">
            Ajouter
          </button>
        </form>
      </section>

      {/* Zones de livraison */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Zones de livraison
        </h2>
        <ul className="mt-4 space-y-2">
          {zones.map((z) => (
            <li
              key={z.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-ink px-4 py-2 text-sm"
            >
              <span className="font-mono text-cream">{z.postalCode}</span>
              <span className="text-muted">frais {formatPrice(z.fee)}</span>
              <span className="text-muted">min {formatPrice(z.minOrder)}</span>
              <form action={adminDeleteZone} className="ml-auto">
                <input type="hidden" name="id" value={z.id} />
                <button className="text-xs text-red-400 hover:text-red-300">
                  Suppr.
                </button>
              </form>
            </li>
          ))}
          {zones.length === 0 && (
            <li className="text-sm text-muted">Aucune zone.</li>
          )}
        </ul>
        <form
          action={adminUpsertZone}
          className="mt-4 flex flex-wrap items-end gap-2"
        >
          <input
            name="postalCode"
            placeholder="Code postal"
            required
            className="w-32 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <input
            name="fee"
            type="number"
            step="0.5"
            placeholder="Frais €"
            className="w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <input
            name="minOrder"
            type="number"
            step="0.5"
            placeholder="Min €"
            className="w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400">
            Ajouter / MAJ
          </button>
        </form>
      </section>
    </div>
  );
}
