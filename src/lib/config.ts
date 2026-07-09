const whatsappOrderNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER ?? "+33775787825";
const telegramOrderUsername =
  process.env.NEXT_PUBLIC_TELEGRAM_ORDER_USERNAME ?? "anatoliagrill";
const telegramUrl = telegramOrderUsername
  ? `https://t.me/${telegramOrderUsername.replace(/^@/, "")}`
  : "";

/** Configuration centrale du site (SEO, QR code, emails, coordonnées). */
export const siteConfig = {
  name: "Anatolia Grill",
  shortName: "Anatolia",
  description:
    "Restaurant turc : grillades au charbon, kebabs, pide, lahmacun, mezze et desserts maison. Sur place, à emporter ou en livraison.",
  /** URL publique (override en prod via NEXT_PUBLIC_SITE_URL). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "fr_FR",
  contact: {
    phone: "07 75 78 78 25",
    email: "contact@lodene.org",
    address: "5 Rue Jules Vallès, 91260 Juvisy-sur-Orge",
  },
  /** Horaires d'ouverture — source unique affichée partout (footer, contact, mobile, QR). */
  hours: {
    summary: "Lun – Dim : 11h30 – 23h00",
    rows: [{ day: "Lundi – Dimanche", time: "11h30 – 23h00" }],
  },
  messaging: {
    whatsappOrderNumber,
    telegramOrderUsername,
  },
  socials: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://facebook.com",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com",
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://tiktok.com",
    whatsapp: `https://wa.me/${whatsappOrderNumber.replace(/\D/g, "")}`,
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? telegramUrl,
  },
  currency: "EUR",
  priceRange: "€€",
} as const;
