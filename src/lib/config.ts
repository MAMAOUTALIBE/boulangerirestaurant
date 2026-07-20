/**
 * Identité du site.
 *
 * `defaultSiteConfig` = valeurs par défaut du template (issues du code / `.env`).
 * En production, elles sont surchargées depuis `/admin/parametres` : la version
 * fusionnée (défauts + base) est fournie par `getSiteConfig()`
 * (`src/lib/site-settings.ts`, serveur) et par `useSiteConfig()`
 * (`src/context/SiteConfigContext.tsx`, client). Ne pas lire `defaultSiteConfig`
 * directement pour de l'affichage : préférer l'une de ces deux sources dynamiques.
 *
 * Ce fichier reste sans dépendance serveur (pas de Prisma) : il est importé
 * aussi bien côté client que serveur.
 */

export interface SiteConfig {
  name: string;
  shortName: string;
  description: string;
  /** URL publique (override en prod via NEXT_PUBLIC_SITE_URL). Technique, non éditable en admin. */
  url: string;
  locale: string;
  contact: {
    phone: string;
    email: string;
    address: string;
    /** Ville affichée seule (zone de livraison, retrait, SEO local). */
    city: string;
  };
  /** Horaires d'ouverture — `summary` est la ligne unique affichée partout. */
  hours: {
    summary: string;
    rows: { day: string; time: string }[];
  };
  messaging: {
    whatsappOrderNumber: string;
    telegramOrderUsername: string;
  };
  socials: {
    facebook: string;
    instagram: string;
    tiktok: string;
    whatsapp: string;
    telegram: string;
  };
  currency: string;
  priceRange: string;
}

const whatsappOrderNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER ?? "+33775787825";
const telegramOrderUsername =
  process.env.NEXT_PUBLIC_TELEGRAM_ORDER_USERNAME ?? "anatoliagrill";

/** Construit un lien wa.me à partir d'un numéro (garde seulement les chiffres). */
export function whatsappUrl(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

/** Construit un lien t.me à partir d'un pseudo (retire un éventuel « @ »). */
export function telegramUrl(username: string): string {
  const handle = username.replace(/^@/, "");
  return handle ? `https://t.me/${handle}` : "";
}

/** Valeurs par défaut du template (fallback quand la base est vide). */
export const defaultSiteConfig: SiteConfig = {
  name: "Restaurant",
  shortName: "Restaurant",
  description:
    "Restaurant turc : grillades au charbon, kebabs, pide, lahmacun, mezze et desserts maison. Sur place, à emporter ou en livraison.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "fr_FR",
  contact: {
    phone: "07 75 78 78 25",
    email: "contact@lodene.org",
    address: "5 Rue Jules Vallès, 91260 Juvisy-sur-Orge",
    city: "Juvisy-sur-Orge",
  },
  hours: {
    summary: "Lun – Dim : 11h30 – 23h00",
    rows: [{ day: "Lundi – Dimanche", time: "11h30 – 23h00" }],
  },
  messaging: {
    whatsappOrderNumber,
    telegramOrderUsername,
  },
  socials: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://facebook.com",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com",
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://tiktok.com",
    whatsapp: whatsappUrl(whatsappOrderNumber),
    telegram:
      process.env.NEXT_PUBLIC_TELEGRAM_URL ??
      telegramUrl(telegramOrderUsername),
  },
  currency: "EUR",
  priceRange: "€€",
};

/** Liens dérivés (tel:, mailto:, Google Maps) calculés à partir d'une config. */
export function buildContactLinks(config: SiteConfig): {
  phoneHref: string;
  emailHref: string;
  mapsHref: string;
} {
  return {
    phoneHref: `tel:${config.contact.phone.replace(/\s/g, "")}`,
    emailHref: `mailto:${config.contact.email}`,
    mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      config.contact.address,
    )}`,
  };
}
