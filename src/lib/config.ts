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

import type { OrderingMode } from "@/lib/online-ordering-rules";

export interface SiteConfig {
  /** Mode public de commande, toujours résolu en vitrine en cas d'inconnu. */
  orderingMode: OrderingMode;
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
  /** Image de marque — éditable depuis /admin/parametres. */
  branding: {
    logoUrl: string;
    faviconUrl: string;
    ogImageUrl: string;
    tagline: string;
  };
  /** Texte superposé au hero d'accueil, contrôlé depuis le CRM. */
  hero: {
    title: string;
    description: string;
    titleVisible: boolean;
    descriptionVisible: boolean;
  };
  /** Référencement de la page d'accueil. */
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  /** Mentions légales structurées (vides tant qu'elles ne sont pas saisies). */
  legal: {
    company: string;
    status: string;
    capital: string;
    siren: string;
    siret: string;
    ape: string;
    vat: string;
    director: string;
    host: string;
  };
  /** Couleur d'accent libre (hex), utilisée si la palette vaut « perso ». */
  accentColor: string;
}

const whatsappOrderNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER ?? "+33666207958";
// Vide par défaut : aucun compte Telegram n'est ouvert pour le restaurant.
// Un pseudo renseigné (ici ou dans /admin/parametres) réaffiche le canal ;
// tant qu'il est vide, tous les rendus le masquent (filtre sur lien non vide).
const telegramOrderUsername =
  process.env.NEXT_PUBLIC_TELEGRAM_ORDER_USERNAME ?? "";

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
  orderingMode: "vitrine",
  name: "Lawale Simbo",
  shortName: "Lawale Simbo",
  description:
    "Lawale Simbo, restaurant et traiteur de spécialités africaines. Sur place, à emporter ou en livraison.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "fr_FR",
  contact: {
    phone: "06 66 20 79 58",
    email: "contact@lodene.org",
    address: "181 rue Robespierre, 93170 Bagnolet",
    city: "Bagnolet",
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
  branding: {
    logoUrl: "/images/logo-lauuale-simbo.webp",
    faviconUrl: "",
    ogImageUrl: "/images/africain/thiep-poisson.webp",
    tagline: "",
  },
  hero: {
    title: "Lawale Simbo",
    description: "Grillades au charbon. Commandez maintenant.",
    titleVisible: true,
    descriptionVisible: true,
  },
  seo: {
    metaTitle: "",
    metaDescription: "",
    keywords: [
      "restaurant africain",
      "spécialités africaines",
      "thiéboudiène",
      "yassa poulet",
      "mafé",
      "attiéké",
      "alloco",
      "bissap",
      "livraison",
    ],
  },
  // Vides par défaut : les mentions légales sont propres à chaque exploitant et
  // se saisissent dans /admin/parametres.
  legal: {
    company: "LAWALE SIMBO",
    status: "EURL (SARL à associé unique)",
    capital: "1 000 €",
    siren: "913 420 048",
    siret: "913 420 048 00021",
    ape: "5610C — Restauration de type rapide",
    vat: "",
    director: "",
    host: "",
  },
  accentColor: "",
};

/** Liens dérivés (tel:, mailto:, Google Maps) calculés à partir d'une config. */
export function buildContactLinks(config: SiteConfig): {
  phoneHref: string;
  emailHref: string;
  mapsHref: string;
  directionsHref: string;
} {
  const encodedAddress = encodeURIComponent(config.contact.address);

  return {
    phoneHref: `tel:${config.contact.phone.replace(/\s/g, "")}`,
    emailHref: `mailto:${config.contact.email}`,
    mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    directionsHref: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
  };
}
