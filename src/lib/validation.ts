import { z } from "zod";

/** Validation de l'inscription newsletter. */
export const newsletterSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});

/** Validation du formulaire de contact. */
export const contactSchema = z.object({
  name: z.string().min(2, "Nom trop court."),
  email: z.string().email("Adresse email invalide."),
  message: z.string().min(10, "Message trop court (10 caractères minimum)."),
});

const lineOptionSchema = z.object({
  groupId: z.string(),
  optionId: z.string(),
  label: z.string(),
  priceDelta: z.number(),
});

/** Une ligne de commande envoyée par le client. */
export const orderLineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  options: z.array(lineOptionSchema).optional(),
  note: z.string().optional(),
});

/** Validation de la création d'une commande. */
export const orderSchema = z.object({
  name: z.string().min(2, "Nom trop court."),
  email: z.string().email("Adresse email invalide."),
  phone: z.string().min(6, "Numéro de téléphone invalide."),
  address: z.string().optional(),
  notes: z.string().optional(),
  promoCode: z.string().optional(),
  fulfillment: z
    .enum(["livraison", "emporter", "surplace"])
    .default("emporter"),
  postalCode: z.string().optional(),
  scheduledAt: z.string().optional(),
  tip: z.coerce.number().min(0).default(0),
  items: z.array(orderLineSchema).min(1, "Le panier est vide."),
});

/** Validation d'une réservation de table. */
export const reservationSchema = z.object({
  name: z.string().min(2, "Nom trop court."),
  email: z.string().email("Adresse email invalide."),
  phone: z.string().min(6, "Numéro de téléphone invalide."),
  date: z.string().min(1, "Date requise."),
  time: z.string().min(1, "Créneau requis."),
  guests: z.coerce.number().int().min(1, "Au moins 1 convive.").max(50),
  notes: z.string().optional(),
});

/** Validation d'une demande de devis traiteur. */
export const cateringSchema = z.object({
  name: z.string().min(2, "Nom trop court."),
  email: z.string().email("Adresse email invalide."),
  phone: z.string().min(6, "Numéro de téléphone invalide."),
  eventDate: z.string().optional(),
  guests: z.coerce
    .number()
    .int()
    .min(1, "Nombre de convives requis.")
    .max(2000),
  message: z.string().min(10, "Décrivez votre projet (10 caractères min)."),
});

/** Validation d'un plat (back-office menu). */
export const dishSchema = z.object({
  name: z.string().min(2, "Nom requis."),
  description: z.string().min(2, "Description requise."),
  price: z.coerce.number().nonnegative("Prix invalide."),
  image: z.string().min(1, "Image requise."),
  tag: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  available: z.boolean().default(true),
});

/** Validation d'un avis client. */
export const reviewSchema = z.object({
  name: z.string().min(2, "Nom trop court."),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10, "Avis trop court (10 caractères min)."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
export type CateringInput = z.infer<typeof cateringSchema>;
