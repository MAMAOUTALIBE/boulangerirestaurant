import { z } from "zod";
import { isSafeMediaUrl } from "@/lib/media-rules";

/** Validation de l'inscription newsletter. */
export const newsletterSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});

/** Validation du formulaire de contact. */
export const contactSchema = z.object({
  name: z.string().min(2, "Nom trop court.").max(120, "Nom trop long."),
  email: z.string().email("Adresse email invalide.").max(320),
  phone: z.string().min(6, "Numéro de téléphone invalide.").max(40),
  message: z
    .string()
    .min(10, "Message trop court (10 caractères minimum).")
    .max(5000, "Message trop long."),
});

const lineOptionSchema = z.object({
  groupId: z.string().max(100),
  optionId: z.string().max(100),
  label: z.string().max(200),
  priceDelta: z.number().min(-10_000).max(10_000),
});

/** Une ligne de commande envoyée par le client. */
export const orderLineSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  // Le prix client est de toute façon rechargé côté serveur ; on le borne quand même.
  price: z.number().nonnegative().max(100_000),
  quantity: z.number().int().positive().max(99, "Quantité trop élevée."),
  options: z.array(lineOptionSchema).max(50).optional(),
  note: z.string().max(500).optional(),
});

/** Validation du suivi panier (POST /api/cart) — tolérant, non bloquant. */
export const cartTrackingSchema = z.object({
  cartId: z.string().min(1).max(200),
  // Email tracké : on ne garde que les adresses au format valide (anti-pollution
  // de leads) ; une valeur invalide est silencieusement ignorée (tracking non bloquant).
  email: z
    .string()
    .max(320)
    .optional()
    .transform((v) =>
      v && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v.toLowerCase() : undefined,
    ),
  name: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  items: z
    .array(
      z
        .object({
          // Coercition robuste : toute valeur non numérique retombe à 0.
          quantity: z.coerce.number().int().min(0).catch(0),
          unitPrice: z.coerce.number().min(0).catch(0),
        })
        .passthrough(),
    )
    .max(200),
});

/** Validation de la création d'une commande. */
export const orderSchema = z
  .object({
    name: z.string().min(2, "Nom trop court.").max(120, "Nom trop long."),
    email: z.string().email("Adresse email invalide.").max(320),
    phone: z.string().min(6, "Numéro de téléphone invalide.").max(40),
    address: z.string().trim().max(300).optional(),
    notes: z.string().max(2000).optional(),
    promoCode: z.string().max(64).optional(),
    fulfillment: z
      .enum(["livraison", "emporter", "surplace"])
      .default("emporter"),
    postalCode: z.string().trim().max(16).optional(),
    scheduledAt: z.string().max(40).optional(),
    tip: z.coerce.number().min(0).max(1000).default(0),
    items: z
      .array(orderLineSchema)
      .min(1, "Le panier est vide.")
      .max(100, "Trop d'articles."),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment !== "livraison") return;

    if (!data.postalCode || data.postalCode.length < 4) {
      ctx.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: "Code postal de livraison requis.",
      });
    }

    if (!data.address || data.address.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Adresse complète de livraison requise.",
      });
    }
  });

/** Validation d'une réservation de table. */
export const reservationSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Prénom trop court.")
      .max(80, "Prénom trop long."),
    lastName: z
      .string()
      .trim()
      .min(2, "Nom trop court.")
      .max(80, "Nom trop long."),
    email: z.string().trim().email("Adresse email invalide.").max(320),
    phone: z.string().trim().min(6, "Numéro de téléphone invalide.").max(40),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Créneau invalide."),
    guests: z.coerce.number().int().min(1, "Au moins 1 convive.").max(50),
    notes: z.string().trim().max(2000, "Demande trop longue.").optional(),
    reminderRequested: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (data.date < today) {
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Choisissez une date à venir.",
      });
    }
  });

/** Validation d'une demande de devis traiteur. */
export const cateringSchema = z.object({
  name: z.string().min(2, "Nom trop court.").max(120, "Nom trop long."),
  email: z.string().email("Adresse email invalide.").max(320),
  phone: z.string().min(6, "Numéro de téléphone invalide.").max(40),
  eventDate: z.string().max(40).optional(),
  guests: z.coerce
    .number()
    .int()
    .min(1, "Nombre de convives requis.")
    .max(2000),
  message: z
    .string()
    .min(10, "Décrivez votre projet (10 caractères min).")
    .max(5000, "Message trop long."),
});

/** Validation d'une demande de devis sur-mesure. */
export const customQuoteSchema = z.object({
  name: z.string().min(2, "Nom trop court.").max(120, "Nom trop long."),
  email: z.string().email("Adresse email invalide.").max(320),
  phone: z.string().min(6, "Numéro de téléphone invalide.").max(40),
  occasion: z.string().min(2, "Occasion requise.").max(200),
  servings: z.coerce
    .number()
    .int()
    .min(1, "Au moins 1 convive.")
    .max(500, "Nombre de convives trop élevé."),
  preferences: z.string().min(2, "Indiquez vos préférences.").max(2000),
  message: z
    .string()
    .max(120, "Message trop long (120 caractères max).")
    .optional(),
  pickupDate: z.string().min(1, "Date de retrait requise.").max(40),
  pickupTime: z.string().max(40).optional(),
  inspirationUrl: z
    .string()
    .url("Lien d'inspiration invalide (URL complète attendue).")
    .refine(
      (v) => /^https?:\/\//i.test(v),
      "Le lien doit commencer par http:// ou https://.",
    )
    .optional(),
  budget: z.string().max(100).optional(),
  allergies: z.string().max(500).optional(),
  details: z
    .string()
    .min(10, "Décrivez votre demande (10 caractères min).")
    .max(5000, "Description trop longue."),
});

/** Validation d'une précommande de produit de saison. */
export const seasonalPreorderSchema = z.object({
  slug: z.string().min(1).max(200),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Au moins 1.")
    .max(50, "Quantité trop élevée."),
  name: z.string().min(2, "Nom trop court.").max(120, "Nom trop long."),
  email: z.string().email("Adresse email invalide.").max(320),
  phone: z.string().min(6, "Numéro de téléphone invalide.").max(40),
  pickupDate: z.string().min(1, "Date de retrait requise.").max(40),
  notes: z.string().max(2000).optional(),
});

/** Validation d'une réservation de panier anti-gaspi. */
export const antiWasteSchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Au moins 1.")
    .max(10, "Maximum 10 paniers."),
  name: z.string().min(2, "Nom trop court.").max(120, "Nom trop long."),
  email: z.string().email("Adresse email invalide.").max(320),
  phone: z.string().min(6, "Numéro de téléphone invalide.").max(40),
  message: z.string().max(300, "Message trop long.").optional(),
});

/**
 * Chemin d'un média interne (`/media/…` téléversé, ou `/images|videos/…` livré
 * avec le site). Refuse les URL externes : la CSP (`img-src 'self'`) et
 * `next/image` (sans `remotePatterns`) les empêcheraient de s'afficher — mieux
 * vaut le dire à l'admin que le laisser enregistrer une image morte.
 */
export const mediaUrlSchema = z
  .string()
  .min(1, "Image requise.")
  .max(1000)
  .refine(isSafeMediaUrl, "Choisissez une image de la médiathèque.");

/**
 * Prix en euros saisi dans un formulaire.
 *
 * ⚠️ Ne PAS utiliser `z.coerce.number()` seul : `Number("")` vaut 0, donc un
 * champ prix effacé passerait la validation et publierait le plat à 0,00 €
 * (commandes gratuites, prix d'origine perdu). On exige donc une saisie non
 * vide avant toute conversion. L'attribut HTML `required` ne suffit pas : il
 * ne protège pas d'une requête forgée.
 */
export const priceSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === "number") return value;
    // La virgule décimale est la saisie naturelle en français (« 12,50 »).
    const texte = value.trim().replace(",", ".");
    // `Number("")` vaut 0 : on force NaN pour que le champ vide soit REFUSÉ.
    return texte === "" ? Number.NaN : Number(texte);
  })
  .refine(
    (n) => Number.isFinite(n) && n >= 0 && n <= 100_000,
    "Prix invalide.",
  );

/** Validation d'une catégorie de menu (back-office). */
export const categorySchema = z.object({
  name: z.string().min(2, "Nom requis.").max(120),
  description: z.string().max(500).optional(),
  // Bannière facultative : une chaîne vide vaut « pas d'image ».
  image: z
    .string()
    .max(1000)
    .optional()
    .refine(
      (value) => !value || isSafeMediaUrl(value),
      "Choisissez une image de la médiathèque.",
    ),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

/** Validation d'un plat (back-office menu). */
export const dishSchema = z.object({
  name: z.string().min(2, "Nom requis.").max(200),
  description: z.string().min(2, "Description requise.").max(5000),
  price: priceSchema,
  image: mediaUrlSchema,
  tag: z.string().max(100).optional(),
  sortOrder: z.coerce.number().int().default(0),
  available: z.boolean().default(true),
});

/** Validation d'un avis client. */
export const reviewSchema = z.object({
  name: z.string().min(2, "Nom trop court.").max(120, "Nom trop long."),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .min(10, "Avis trop court (10 caractères min).")
    .max(5000, "Avis trop long."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
export type CateringInput = z.infer<typeof cateringSchema>;
export type CustomQuoteInput = z.infer<typeof customQuoteSchema>;
export type SeasonalPreorderInput = z.infer<typeof seasonalPreorderSchema>;
export type AntiWasteInput = z.infer<typeof antiWasteSchema>;
