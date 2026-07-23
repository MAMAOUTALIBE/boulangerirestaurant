import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/site-settings";

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
