import { siteConfig } from "@/lib/config";

export const phoneHref = `tel:${siteConfig.contact.phone.replace(/\s/g, "")}`;
export const emailHref = `mailto:${siteConfig.contact.email}`;
export const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  siteConfig.contact.address,
)}`;
