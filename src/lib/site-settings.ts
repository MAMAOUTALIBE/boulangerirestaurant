import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  defaultSiteConfig,
  telegramUrl,
  whatsappUrl,
  type SiteConfig,
} from "@/lib/config";

/** Renvoie `value` si non vide, sinon `fallback`. */
function pick(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

type SiteSettingRow = {
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
  };
}

/**
 * Identité du site fusionnée (défauts du template + surcharges admin).
 * Mise en cache par requête (React `cache`) : plusieurs appels dans le même
 * rendu ne touchent la base qu'une fois. Retombe sur les défauts si la base
 * est indisponible.
 */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const row = await prisma.siteSetting
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  return mergeSiteConfig(defaultSiteConfig, row);
});
