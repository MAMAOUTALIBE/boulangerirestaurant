import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
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
