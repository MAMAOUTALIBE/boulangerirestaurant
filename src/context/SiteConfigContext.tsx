"use client";

import { createContext, useContext } from "react";
import { defaultSiteConfig, type SiteConfig } from "@/lib/config";

/**
 * Fournit l'identité du site (fusionnée défauts + surcharges admin) aux
 * composants client, qui ne peuvent pas lire la base directement. La valeur est
 * lue une fois côté serveur dans `src/app/layout.tsx` puis passée au provider.
 */
const SiteConfigContext = createContext<SiteConfig>(defaultSiteConfig);

export function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteConfig;
  children: React.ReactNode;
}) {
  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

/** Identité du site côté client (voir `getSiteConfig()` côté serveur). */
export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
