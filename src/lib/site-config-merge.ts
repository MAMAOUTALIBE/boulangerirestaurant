import { telegramUrl, whatsappUrl, type SiteConfig } from "@/lib/config";

function pick(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export type SiteSettingRow = {
  name: string | null;
  shortName: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  whatsappNumber: string | null;
  telegramUsername: string | null;
  hoursSummary: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  tagline?: string | null;
  heroTitle?: string | null;
  heroDescription?: string | null;
  heroTitleVisible?: boolean;
  heroDescriptionVisible?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  legalCompany?: string | null;
  legalStatus?: string | null;
  legalCapital?: string | null;
  legalSiren?: string | null;
  legalSiret?: string | null;
  legalApe?: string | null;
  legalVat?: string | null;
  legalDirector?: string | null;
  legalHost?: string | null;
  accentColor?: string | null;
};

/** Fusionne une ligne SiteSetting par-dessus les valeurs par défaut du template. */
export function mergeSiteConfig(
  defaults: SiteConfig,
  row: SiteSettingRow | null,
): SiteConfig {
  if (!row) return defaults;

  const whatsappNumber = pick(
    row.whatsappNumber,
    defaults.messaging.whatsappOrderNumber,
  );
  const telegramUsername = pick(
    row.telegramUsername,
    defaults.messaging.telegramOrderUsername,
  );

  return {
    ...defaults,
    name: pick(row.name, defaults.name),
    shortName: pick(row.shortName, defaults.shortName),
    description: pick(row.description, defaults.description),
    contact: {
      phone: pick(row.phone, defaults.contact.phone),
      email: pick(row.email, defaults.contact.email),
      address: pick(row.address, defaults.contact.address),
      city: pick(row.city, defaults.contact.city),
    },
    hours: {
      ...defaults.hours,
      summary: pick(row.hoursSummary, defaults.hours.summary),
    },
    messaging: {
      whatsappOrderNumber: whatsappNumber,
      telegramOrderUsername: telegramUsername,
    },
    socials: {
      facebook: pick(row.facebook, defaults.socials.facebook),
      instagram: pick(row.instagram, defaults.socials.instagram),
      tiktok: pick(row.tiktok, defaults.socials.tiktok),
      whatsapp: whatsappUrl(whatsappNumber) || defaults.socials.whatsapp,
      telegram: telegramUrl(telegramUsername) || defaults.socials.telegram,
    },
    branding: {
      logoUrl: pick(row.logoUrl, defaults.branding.logoUrl),
      faviconUrl: pick(row.faviconUrl, defaults.branding.faviconUrl),
      ogImageUrl: pick(row.ogImageUrl, defaults.branding.ogImageUrl),
      tagline: pick(row.tagline, defaults.branding.tagline),
    },
    hero: {
      title: pick(row.heroTitle, pick(row.name, defaults.name)),
      description: pick(row.heroDescription, defaults.hero.description),
      titleVisible: row.heroTitleVisible ?? defaults.hero.titleVisible,
      descriptionVisible:
        row.heroDescriptionVisible ?? defaults.hero.descriptionVisible,
    },
    seo: {
      metaTitle: pick(row.metaTitle, defaults.seo.metaTitle),
      metaDescription: pick(row.metaDescription, defaults.seo.metaDescription),
      keywords: row.keywords?.trim()
        ? row.keywords
            .split(",")
            .map((mot) => mot.trim())
            .filter(Boolean)
        : defaults.seo.keywords,
    },
    legal: {
      company: pick(row.legalCompany, defaults.legal.company),
      status: pick(row.legalStatus, defaults.legal.status),
      capital: pick(row.legalCapital, defaults.legal.capital),
      siren: pick(row.legalSiren, defaults.legal.siren),
      siret: pick(row.legalSiret, defaults.legal.siret),
      ape: pick(row.legalApe, defaults.legal.ape),
      vat: pick(row.legalVat, defaults.legal.vat),
      director: pick(row.legalDirector, defaults.legal.director),
      host: pick(row.legalHost, defaults.legal.host),
    },
    accentColor: pick(row.accentColor, defaults.accentColor),
  };
}
