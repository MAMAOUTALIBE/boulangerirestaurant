import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { defaultSiteConfig, type SiteConfig } from "@/lib/config";
import { resolveOrderingMode } from "@/lib/online-ordering-rules";
import { mergeSiteConfig } from "@/lib/site-config-merge";

/**
 * Identité du site fusionnée (défauts du template + surcharges admin).
 * Mise en cache par requête (React `cache`) : plusieurs appels dans le même
 * rendu ne touchent la base qu'une fois. Retombe sur les défauts si la base
 * est indisponible.
 */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const [row, ordering] = await Promise.all([
    prisma.siteSetting
      .findUnique({ where: { id: "default" } })
      .catch(() => null),
    prisma.orderingSetting
      .findUnique({
        where: { id: "default" },
        select: { orderingMode: true },
      })
      .catch(() => null),
  ]);
  return {
    ...mergeSiteConfig(defaultSiteConfig, row),
    orderingMode: resolveOrderingMode(ordering?.orderingMode),
  };
});
