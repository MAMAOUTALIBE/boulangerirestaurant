import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteConfig = await getSiteConfig();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pages privées / transactionnelles non indexées.
      disallow: ["/compte", "/commande/", "/admin"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
