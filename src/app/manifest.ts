import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/site-settings";

// Rendu dynamique : le nom vient de l'identité éditable. Généré au build (base
// injoignable dans Docker), il resterait bloqué sur le nom par défaut du
// template après un changement de nom depuis le CRM.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteConfig = await getSiteConfig();
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description:
      "Commandez nos plats, grillades et spécialités africaines en ligne.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
