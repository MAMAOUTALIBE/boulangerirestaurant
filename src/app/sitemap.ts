import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/site-settings";
import { getDishes } from "@/lib/dishes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteConfig = await getSiteConfig();
  const base = siteConfig.url;

  // Une URL par produit disponible → chaque produit indexable par Google.
  const dishes = await getDishes().catch(() => []);
  const dishUrls: MetadataRoute.Sitemap = dishes.map((d) => ({
    url: `${base}/menu/${d.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/menu`, changeFrequency: "weekly", priority: 0.9 },
    ...dishUrls,
    { url: `${base}/commander`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/reservation`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/traiteur`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${base}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    { url: `${base}/cgv`, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${base}/confidentialite`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
