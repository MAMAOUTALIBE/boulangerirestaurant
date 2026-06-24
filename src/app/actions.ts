"use server";

import { z } from "zod";
import type { OrderLine } from "@/types";
import {
  antiWasteSchema,
  cateringSchema,
  contactSchema,
  customCakeSchema,
  dishSchema,
  newsletterSchema,
  orderSchema,
  reservationSchema,
  reviewSchema,
  seasonalPreorderSchema,
} from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import {
  createOrder,
  getOrderByReference,
  OrderCreationError,
  updateOrderStatus,
} from "@/lib/orders";
import { startCheckout } from "@/lib/payment";
import { upsertCustomer } from "@/lib/customers";
import { createSession, destroySession, getSessionEmail } from "@/lib/session";
import {
  createMagicLink,
  isAdminEmail,
  isValidAdminPassword,
} from "@/lib/auth";
import type { OrderStatus } from "@/types";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  createRestaurantOnboardingLink,
  isStripeConnectConfigured,
  syncRestaurantStripeStatus,
} from "@/lib/stripe-connect";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface ActionState {
  ok: boolean;
  message: string;
  /** Erreurs par champ pour affichage inline. */
  errors?: Record<string, string>;
}

/** Détecte un bot via le champ honeypot (doit rester vide). */
function isBot(formData: FormData): boolean {
  return Boolean(formData.get("company"));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const TOO_MANY: ActionState = {
  ok: false,
  message: "Trop de tentatives. Réessayez dans une minute.",
};

/** Inscription à la newsletter (Server Action liée à un <form>). */
export async function subscribeNewsletter(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Merci !" };
  if (!(await rateLimit(`newsletter:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });
  if (existing) {
    return { ok: true, message: "Vous êtes déjà inscrit·e. Merci !" };
  }
  await prisma.newsletterSubscriber.create({ data: { email } });

  // Automation : email de bienvenue.
  await sendEmail({
    to: email,
    subject: `Bienvenue chez ${siteConfig.shortName}`,
    html: `<h1>Bienvenue !</h1>
      <p>Merci de rejoindre la communauté ${siteConfig.name}.</p>
      <p>Profitez de <strong>-10%</strong> sur votre première commande avec le code <strong>BOULANGERIE10</strong>.</p>`,
  });

  return { ok: true, message: "Merci ! Votre inscription est confirmée." };
}

/** Envoi du formulaire de contact. */
export async function sendContactMessage(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Message envoyé !" };
  if (!(await rateLimit(`contact:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }

  const msg = await prisma.contactMessage.create({ data: parsed.data });

  await sendEmail({
    to: siteConfig.contact.email,
    subject: `Nouveau message de ${msg.name}`,
    html: `<p><strong>${msg.name}</strong> (${msg.email}) a écrit :</p><p>${msg.message}</p>`,
  });

  return { ok: true, message: "Message envoyé ! Nous vous répondrons vite." };
}

/** Soumission d'un avis client (publié après modération). */
export async function submitReview(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Merci pour votre avis !" };
  if (!(await rateLimit(`review:${await clientIp()}`, 3, 60_000)))
    return TOO_MANY;

  const parsed = reviewSchema.safeParse({
    name: formData.get("name"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }
  await prisma.review.create({ data: parsed.data });
  return {
    ok: true,
    message: "Merci ! Votre avis sera publié après validation.",
  };
}

/** Back-office : approuve un avis. */
export async function adminApproveReview(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.review.update({ where: { id }, data: { approved: true } });
    revalidatePath("/admin/avis");
  }
  redirect("/admin/avis");
}

/** Back-office : supprime un avis. */
export async function adminDeleteReview(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.review.delete({ where: { id } }).catch(() => {});
    revalidatePath("/admin/avis");
  }
  redirect("/admin/avis");
}

/** Réservation de table. */
export async function createReservation(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Demande envoyée !" };
  if (!(await rateLimit(`reservation:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = reservationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    date: formData.get("date"),
    time: formData.get("time"),
    guests: formData.get("guests"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }

  const ref = `RV-${Date.now().toString(36).toUpperCase()}`;
  await prisma.reservation.create({
    data: { reference: ref, ...parsed.data },
  });
  await upsertCustomer(parsed.data.email, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  await sendEmail({
    to: parsed.data.email,
    subject: `Votre demande de réservation ${ref}`,
    html: `<h1>Merci ${parsed.data.name} !</h1>
      <p>Votre demande de réservation pour ${parsed.data.guests} personne(s)
      le ${parsed.data.date} à ${parsed.data.time} a bien été reçue
      (réf. ${ref}). Nous la confirmons sous peu.</p>`,
  });

  return {
    ok: true,
    message: `Demande envoyée (réf. ${ref}) ! Vous recevrez une confirmation par email.`,
  };
}

/** Demande de devis traiteur. */
export async function requestCatering(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Demande envoyée !" };
  if (!(await rateLimit(`catering:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = cateringSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    eventDate: formData.get("eventDate") || undefined,
    guests: formData.get("guests"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }

  await prisma.cateringRequest.create({ data: parsed.data });
  await upsertCustomer(parsed.data.email, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  await sendEmail({
    to: siteConfig.contact.email,
    subject: `Nouvelle demande traiteur de ${parsed.data.name}`,
    html: `<p><strong>${parsed.data.name}</strong> (${parsed.data.email}, ${parsed.data.phone})
      pour ${parsed.data.guests} convives${parsed.data.eventDate ? ` le ${parsed.data.eventDate}` : ""} :</p>
      <p>${parsed.data.message}</p>`,
  });

  return {
    ok: true,
    message: "Demande de devis envoyée ! Nous revenons vers vous rapidement.",
  };
}

/** Demande de gâteau personnalisé (sur-mesure). */
export async function requestCustomCake(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Demande envoyée !" };
  if (!(await rateLimit(`cake:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = customCakeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    occasion: formData.get("occasion"),
    servings: formData.get("servings"),
    flavor: formData.get("flavor"),
    messageOnCake: formData.get("messageOnCake") || undefined,
    pickupDate: formData.get("pickupDate"),
    pickupTime: formData.get("pickupTime") || undefined,
    inspirationUrl: formData.get("inspirationUrl") || undefined,
    budget: formData.get("budget") || undefined,
    allergies: formData.get("allergies") || undefined,
    details: formData.get("details"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }

  const ref = `CC-${Date.now().toString(36).toUpperCase()}`;
  await prisma.customCakeRequest.create({
    data: { reference: ref, ...parsed.data },
  });
  await upsertCustomer(parsed.data.email, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  await sendEmail({
    to: siteConfig.contact.email,
    subject: `Nouvelle demande de gâteau de ${parsed.data.name} (${ref})`,
    html: `<p><strong>${parsed.data.name}</strong> (${parsed.data.email}, ${parsed.data.phone})</p>
      <ul>
        <li>Occasion : ${parsed.data.occasion}</li>
        <li>Parts : ${parsed.data.servings}</li>
        <li>Parfum / base : ${parsed.data.flavor}</li>
        <li>Retrait : ${parsed.data.pickupDate}${parsed.data.pickupTime ? ` à ${parsed.data.pickupTime}` : ""}</li>
        ${parsed.data.messageOnCake ? `<li>Message sur le gâteau : ${parsed.data.messageOnCake}</li>` : ""}
        ${parsed.data.budget ? `<li>Budget indicatif : ${parsed.data.budget}</li>` : ""}
        ${parsed.data.allergies ? `<li>Allergies : ${parsed.data.allergies}</li>` : ""}
        ${parsed.data.inspirationUrl ? `<li>Inspiration : <a href="${parsed.data.inspirationUrl}">${parsed.data.inspirationUrl}</a></li>` : ""}
      </ul>
      <p>${parsed.data.details}</p>`,
  });
  await sendEmail({
    to: parsed.data.email,
    subject: `Votre demande de gâteau ${ref}`,
    html: `<h1>Merci ${parsed.data.name} !</h1>
      <p>Votre demande de gâteau personnalisé pour le ${parsed.data.pickupDate}
      (réf. ${ref}) a bien été reçue. Nous revenons vers vous avec un devis
      sur mesure.</p>`,
  });

  return {
    ok: true,
    message: `Demande envoyée (réf. ${ref}) ! Nous revenons vers vous avec un devis personnalisé.`,
  };
}

/** Précommande d'un produit de saison (paiement au retrait). */
export async function reserveSeasonal(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Précommande envoyée !" };
  if (!(await rateLimit(`seasonal:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = seasonalPreorderSchema.safeParse({
    slug: formData.get("slug"),
    quantity: formData.get("quantity"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    pickupDate: formData.get("pickupDate"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }

  const { createSeasonalPreorder, SeasonalError } =
    await import("@/lib/seasonal");
  try {
    const { preorder, product } = await createSeasonalPreorder({
      slug: parsed.data.slug,
      quantity: parsed.data.quantity,
      customer: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
      },
      pickupDate: parsed.data.pickupDate,
      notes: parsed.data.notes,
    });
    await upsertCustomer(parsed.data.email, {
      name: parsed.data.name,
      phone: parsed.data.phone,
    });

    await sendEmail({
      to: parsed.data.email,
      subject: `Votre précommande ${preorder.reference} — ${product.name}`,
      html: `<h1>Merci ${parsed.data.name} !</h1>
        <p>Votre précommande de ${preorder.quantity} × ${product.name}
        (réf. ${preorder.reference}) est confirmée, à retirer le
        ${parsed.data.pickupDate}. Paiement au retrait en boutique.</p>`,
    });
    await sendEmail({
      to: siteConfig.contact.email,
      subject: `Nouvelle précommande ${product.name} (${preorder.reference})`,
      html: `<p>${parsed.data.name} (${parsed.data.email}, ${parsed.data.phone})
        a précommandé ${preorder.quantity} × ${product.name} pour le
        ${parsed.data.pickupDate}.</p>`,
    });

    revalidatePath("/boutique-de-saison");
    return {
      ok: true,
      message: `Précommande confirmée (réf. ${preorder.reference}) ! Paiement au retrait le ${parsed.data.pickupDate}.`,
    };
  } catch (error) {
    if (error instanceof SeasonalError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

/** Réservation d'un panier anti-gaspi du jour (paiement au retrait). */
export async function reserveAntiWaste(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Réservation envoyée !" };
  if (!(await rateLimit(`antigaspi:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = antiWasteSchema.safeParse({
    quantity: formData.get("quantity"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }

  const { createAntiWasteReservation, AntiWasteError } =
    await import("@/lib/antiwaste");
  try {
    const { reservation, offer } = await createAntiWasteReservation({
      quantity: parsed.data.quantity,
      customer: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
      },
    });
    await upsertCustomer(parsed.data.email, {
      name: parsed.data.name,
      phone: parsed.data.phone,
    });

    await sendEmail({
      to: parsed.data.email,
      subject: `Votre panier anti-gaspi ${reservation.reference}`,
      html: `<h1>Merci ${parsed.data.name} !</h1>
        <p>Vous avez réservé ${reservation.quantity} panier(s) anti-gaspi
        (réf. ${reservation.reference}). Retrait ce soir entre
        ${offer.pickupStart} et ${offer.pickupEnd}. Paiement sur place.</p>`,
    });
    await sendEmail({
      to: siteConfig.contact.email,
      subject: `Nouvelle réservation anti-gaspi (${reservation.reference})`,
      html: `<p>${parsed.data.name} (${parsed.data.email}, ${parsed.data.phone})
        a réservé ${reservation.quantity} panier(s) pour ce soir.</p>
        ${
          parsed.data.message
            ? `<p><strong>Message client :</strong> ${escapeHtml(parsed.data.message)}</p>`
            : ""
        }`,
    });

    revalidatePath("/anti-gaspi");
    return {
      ok: true,
      message: `Votre demande de réservation a bien été envoyée. Nous vous confirmerons la disponibilité rapidement. Référence ${reservation.reference}. Retrait ce soir entre ${offer.pickupStart} et ${offer.pickupEnd}.`,
    };
  } catch (error) {
    if (error instanceof AntiWasteError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

export interface OrderActionState extends ActionState {
  reference?: string;
}

/** Création d'une commande depuis la page /commander. */
export async function placeOrder(
  _prev: OrderActionState | null,
  formData: FormData,
): Promise<OrderActionState> {
  let items: OrderLine[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    items = [];
  }

  const parsed = orderSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    promoCode: formData.get("promoCode") || undefined,
    fulfillment: formData.get("fulfillment") || "emporter",
    postalCode: formData.get("postalCode") || undefined,
    scheduledAt: formData.get("scheduledAt") || undefined,
    tip: formData.get("tip") || 0,
    items,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez votre saisie.",
      errors: fieldErrors(parsed.error),
    };
  }

  const {
    name,
    email,
    phone,
    address,
    notes,
    promoCode,
    fulfillment,
    postalCode,
    scheduledAt,
    tip,
    items: lines,
  } = parsed.data;

  // Vérifie la livraison (zone + minimum) avant de créer.
  if (fulfillment === "livraison") {
    const subtotal = lines.reduce((s, i) => s + i.price * i.quantity, 0);
    const { quoteDelivery } = await import("@/lib/delivery");
    const q = await quoteDelivery(postalCode ?? "", subtotal);
    if (!q.available) {
      return { ok: false, message: q.reason ?? "Livraison indisponible." };
    }
  }

  let order;
  try {
    order = await createOrder({
      customer: { name, email, phone, address, notes },
      items: lines,
      promoCode,
      fulfillment,
      postalCode,
      tip,
      scheduledAt,
    });
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const { notifyOrderChannels } = await import("@/lib/order-notifications");
  await notifyOrderChannels(order);

  // Marque le panier suivi comme converti (funnel + relance).
  const cartId = String(formData.get("cartId") ?? "");
  if (cartId) {
    await prisma.abandonedCart
      .updateMany({ where: { cartId }, data: { status: "converti" } })
      .catch(() => {});
  }

  return {
    ok: true,
    message: "Commande enregistrée.",
    reference: order.reference,
  };
}

/** Valide un code promo (retour live pour la page commande). */
export async function checkPromo(
  code: string,
  subtotal: number,
): Promise<{ ok: boolean; message: string; discount?: number }> {
  const { evaluatePromo } = await import("@/lib/promo");
  const r = await evaluatePromo(code, subtotal);
  if (!r.valid) return { ok: false, message: r.reason ?? "Code invalide." };
  return {
    ok: true,
    message: `Code ${r.code} appliqué.`,
    discount: r.discount,
  };
}

/** Évalue les frais de livraison pour un code postal (retour live checkout). */
export async function checkDelivery(
  postalCode: string,
  subtotal: number,
): Promise<{ ok: boolean; message: string; fee: number }> {
  const { quoteDelivery } = await import("@/lib/delivery");
  const q = await quoteDelivery(postalCode, subtotal);
  if (!q.available)
    return { ok: false, message: q.reason ?? "Zone non desservie.", fee: 0 };
  return { ok: true, message: `Livraison ${q.fee.toFixed(2)} €`, fee: q.fee };
}

/** Recommander : lignes d'une commande passée, enrichies de l'image du plat. */
export async function getReorderItems(reference: string): Promise<
  {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    options?: {
      groupId: string;
      optionId: string;
      label: string;
      priceDelta: number;
    }[];
    note?: string;
  }[]
> {
  const { getOrderByReference } = await import("@/lib/orders");
  const order = await getOrderByReference(reference);
  if (!order) return [];

  const slugs = order.items.map((i) => i.id);
  const dishes = await prisma.dish.findMany({ where: { slug: { in: slugs } } });
  const imageBySlug = new Map(dishes.map((d) => [d.slug, d.image]));

  return order.items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: imageBySlug.get(i.id) ?? "/images/boulangerie-hero.webp",
    options: i.options,
    note: i.note,
  }));
}

/**
 * Lance le paiement d'une commande.
 * - Stripe configuré → redirige vers la session Stripe Checkout.
 * - Sinon → simulation : la commande passe en « payée ».
 */
export async function payOrder(reference: string): Promise<void> {
  const order = await getOrderByReference(reference);
  if (!order) redirect("/");

  const result = await startCheckout(order);
  if (result.url) {
    redirect(result.url);
  }
  // Mode simulation : paiement validé immédiatement.
  await updateOrderStatus(reference, "payée");
  revalidatePath(`/commande/${reference}`);
  redirect(`/commande/${reference}?paid=1`);
}

/**
 * Demande de connexion : envoie un lien magique vérifié par email.
 * Ne crée PAS de session ici — l'identité n'est prouvée qu'en cliquant le lien.
 */
export async function login(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await rateLimit(`login:${await clientIp()}`, 3, 60_000)))
    return TOO_MANY;

  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, message: "Adresse email invalide." };
  }
  await createMagicLink(parsed.data.email);
  return {
    ok: true,
    message:
      "Un lien de connexion vient de vous être envoyé par email. Vérifiez votre boîte de réception.",
  };
}

/**
 * Connexion directe réservée au back-office.
 * Utilise l'allowlist ADMIN_EMAILS et le mot de passe ADMIN_PASSWORD.
 */
export async function adminLogin(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await rateLimit(`admin-login:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = z
    .object({
      email: z
        .string()
        .email("Adresse email invalide.")
        .transform((v) => v.toLowerCase()),
      password: z.string().min(1, "Mot de passe requis."),
    })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Email ou mot de passe invalide.",
    };
  }

  if (
    !isAdminEmail(parsed.data.email) ||
    !isValidAdminPassword(parsed.data.password)
  ) {
    return {
      ok: false,
      message: "Email ou mot de passe invalide.",
    };
  }

  await createSession(parsed.data.email);
  redirect("/admin");
}

/** Déconnexion. */
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

/**
 * Espace client : convertit les points de fidélité en code promo.
 * 100 points = 5 € de remise.
 */
export async function redeemLoyalty(): Promise<void> {
  const email = await getSessionEmail();
  if (!email) redirect("/compte");

  const { POINTS_PER_REDEMPTION, REDEMPTION_VALUE_EUR } =
    await import("@/lib/loyalty");
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || customer.loyaltyPoints < POINTS_PER_REDEMPTION) {
    redirect("/compte?fid=insuffisant");
  }

  const code = `FID-${Math.floor(Date.now()).toString(36).toUpperCase().slice(-6)}`;
  await prisma.$transaction([
    prisma.customer.update({
      where: { email },
      data: { loyaltyPoints: { decrement: POINTS_PER_REDEMPTION } },
    }),
    prisma.promoCode.create({
      data: {
        code,
        type: "fixed",
        value: REDEMPTION_VALUE_EUR,
        active: true,
        usageLimit: 1,
      },
    }),
  ]);
  redirect(`/compte?fid=${code}`);
}

const VALID_STATUSES: OrderStatus[] = [
  "en attente",
  "payée",
  "en préparation",
  "prête",
  "en livraison",
  "livrée",
  "annulée",
];

/**
 * Back-office : change le statut d'une commande.
 * Réservé aux emails de l'allowlist `ADMIN_EMAILS`.
 */
export async function adminSetOrderStatus(formData: FormData): Promise<void> {
  const email = await getSessionEmail();
  if (!isAdminEmail(email)) redirect("/compte");

  const reference = String(formData.get("reference") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const back = String(formData.get("back") ?? "/admin/commandes");
  if (!reference || !VALID_STATUSES.includes(status)) {
    redirect("/admin/commandes?error=1");
  }

  await updateOrderStatus(reference, status, email ?? "admin");
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${reference}`);
  redirect(back);
}

/** Étape suivante du workflow opérationnel d'une commande. */
function nextStatus(
  current: string,
  delivery: boolean,
): OrderStatus | undefined {
  const flow: Record<string, OrderStatus> = {
    "en attente": "payée",
    payée: "en préparation",
    "en préparation": "prête",
    // En livraison, « prête » → « en livraison » → « livrée ». Sinon directement « livrée ».
    prête: delivery ? "en livraison" : "livrée",
    "en livraison": "livrée",
  };
  return flow[current];
}

/** Écran de service : fait avancer une commande à l'étape suivante. */
export async function advanceOrderStatus(formData: FormData): Promise<void> {
  const email = await getSessionEmail();
  if (!isAdminEmail(email)) redirect("/compte");

  const reference = String(formData.get("reference") ?? "");
  const current = String(formData.get("current") ?? "");
  const order = reference
    ? await prisma.order.findUnique({
        where: { reference },
        select: { fulfillment: true },
      })
    : null;
  const next = nextStatus(current, order?.fulfillment === "livraison");
  if (reference && next) {
    await updateOrderStatus(reference, next, email ?? "service");
    revalidatePath("/admin/service");
  }
  redirect("/admin/service");
}

const RESERVATION_STATUSES = ["en attente", "confirmée", "annulée"];
const CATERING_STATUSES = ["nouveau", "devis envoyé", "gagné", "perdu"];
const CAKE_STATUSES = [
  "nouveau",
  "devis envoyé",
  "confirmé",
  "prêt",
  "récupéré",
  "annulé",
];
const SEASONAL_PREORDER_STATUSES = [
  "réservé",
  "confirmé",
  "prêt",
  "récupéré",
  "annulé",
];
const ANTIWASTE_STATUSES = ["réservé", "récupéré", "annulé"];

/** Back-office : change le statut d'une réservation. */
export async function adminSetReservationStatus(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && RESERVATION_STATUSES.includes(status)) {
    await prisma.reservation.update({ where: { id }, data: { status } });
    revalidatePath("/admin/reservations");
  }
  redirect("/admin/reservations");
}

/** Back-office : change le statut d'une demande traiteur (pipeline). */
export async function adminSetCateringStatus(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && CATERING_STATUSES.includes(status)) {
    await prisma.cateringRequest.update({ where: { id }, data: { status } });
    revalidatePath("/admin/traiteur");
  }
  redirect("/admin/traiteur");
}

/** Back-office : change le statut d'une demande de gâteau personnalisé. */
export async function adminSetCustomCakeStatus(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && CAKE_STATUSES.includes(status)) {
    await prisma.customCakeRequest.update({ where: { id }, data: { status } });
    revalidatePath("/admin/gateaux");
  }
  redirect("/admin/gateaux");
}

/** Back-office : crée une offre de saison (précommandes). */
export async function adminCreateSeasonalProduct(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const salesStart = String(formData.get("salesStart") ?? "");
  const salesEnd = String(formData.get("salesEnd") ?? "");
  const pickupStart = String(formData.get("pickupStart") ?? "");
  const pickupEnd = String(formData.get("pickupEnd") ?? "");
  const quota = Math.max(0, Number(formData.get("quota") ?? 0) || 0);
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!name || !salesStart || !salesEnd || !pickupStart || !pickupEnd) {
    redirect("/admin/saison?error=1");
  }

  const base = slugify(name) || `saison-${Date.now()}`;
  let slug = base;
  let n = 1;
  while (await prisma.seasonalProduct.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`;
  }

  await prisma.seasonalProduct.create({
    data: {
      slug,
      name,
      description,
      image: image || "/images/boulangerie-patisseries.webp",
      price,
      salesStart: new Date(salesStart),
      salesEnd: new Date(salesEnd),
      pickupStart,
      pickupEnd,
      quota,
      sortOrder,
    },
  });
  revalidatePath("/admin/saison");
  redirect("/admin/saison");
}

/** Back-office : met à jour une offre de saison. */
export async function adminUpdateSeasonalProduct(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/saison?error=1");
  await prisma.seasonalProduct.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      image:
        String(formData.get("image") ?? "").trim() ||
        "/images/boulangerie-patisseries.webp",
      price: Number(formData.get("price") ?? 0),
      salesStart: new Date(String(formData.get("salesStart") ?? "")),
      salesEnd: new Date(String(formData.get("salesEnd") ?? "")),
      pickupStart: String(formData.get("pickupStart") ?? ""),
      pickupEnd: String(formData.get("pickupEnd") ?? ""),
      quota: Math.max(0, Number(formData.get("quota") ?? 0) || 0),
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
      active: formData.get("active") === "on",
    },
  });
  revalidatePath("/admin/saison");
  redirect("/admin/saison");
}

/** Back-office : supprime une offre de saison (et ses précommandes). */
export async function adminDeleteSeasonalProduct(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.seasonalProduct.delete({ where: { id } }).catch(() => {});
    revalidatePath("/admin/saison");
  }
  redirect("/admin/saison");
}

/** Back-office : change le statut d'une précommande de saison. */
export async function adminSetSeasonalPreorderStatus(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && SEASONAL_PREORDER_STATUSES.includes(status)) {
    await prisma.seasonalPreorder.update({ where: { id }, data: { status } });
    revalidatePath("/admin/saison");
  }
  redirect("/admin/saison");
}

/** Back-office : marque une précommande de saison comme payée (ou non). */
export async function adminToggleSeasonalPreorderPaid(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const paid = formData.get("paid") === "true";
  if (id) {
    await prisma.seasonalPreorder.update({ where: { id }, data: { paid } });
    revalidatePath("/admin/saison");
  }
  redirect("/admin/saison");
}

/** Back-office : crée/met à jour l'offre anti-gaspi d'un jour (clé = date). */
export async function adminUpsertAntiWasteOffer(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const date = String(formData.get("date") ?? "").trim();
  if (!date) redirect("/admin/anti-gaspi?error=1");
  const title = String(formData.get("title") ?? "").trim() || "Panier surprise";
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const originalValueRaw = String(formData.get("originalValue") ?? "").trim();
  const originalValue = originalValueRaw ? Number(originalValueRaw) : null;
  const quantity = Math.max(0, Number(formData.get("quantity") ?? 0) || 0);
  const pickupStart = String(formData.get("pickupStart") ?? "18:00") || "18:00";
  const pickupEnd = String(formData.get("pickupEnd") ?? "19:30") || "19:30";
  const active = formData.get("active") === "on";

  const data = {
    title,
    description,
    price,
    originalValue,
    quantity,
    pickupStart,
    pickupEnd,
    active,
  };
  await prisma.antiWasteOffer.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });
  revalidatePath("/admin/anti-gaspi");
  redirect("/admin/anti-gaspi");
}

/** Back-office : supprime une offre anti-gaspi (et ses réservations). */
export async function adminDeleteAntiWasteOffer(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.antiWasteOffer.delete({ where: { id } }).catch(() => {});
    revalidatePath("/admin/anti-gaspi");
  }
  redirect("/admin/anti-gaspi");
}

/** Back-office : change le statut d'une réservation anti-gaspi. */
export async function adminSetAntiWasteReservationStatus(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && ANTIWASTE_STATUSES.includes(status)) {
    await prisma.antiWasteReservation.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/anti-gaspi");
  }
  redirect("/admin/anti-gaspi");
}

/** Back-office : marque une réservation anti-gaspi comme payée (ou non). */
export async function adminToggleAntiWasteReservationPaid(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const paid = formData.get("paid") === "true";
  if (id) {
    await prisma.antiWasteReservation.update({
      where: { id },
      data: { paid },
    });
    revalidatePath("/admin/anti-gaspi");
  }
  redirect("/admin/anti-gaspi");
}

/** Back-office : marque un message de contact comme traité (ou non). */
export async function adminToggleContactHandled(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const handled = formData.get("handled") === "true";
  if (id) {
    await prisma.contactMessage.update({ where: { id }, data: { handled } });
    revalidatePath("/admin/messages");
  }
  redirect("/admin/messages");
}

/** Back-office : met à jour les notes/tags d'un client. */
export async function adminUpdateCustomer(formData: FormData): Promise<void> {
  const sessionEmail = await getSessionEmail();
  if (!isAdminEmail(sessionEmail)) redirect("/compte");

  const email = String(formData.get("email") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (email) {
    const { updateCustomerCrm } = await import("@/lib/customers");
    await updateCustomerCrm(email, notes, tags);
    revalidatePath(`/admin/clients/${encodeURIComponent(email)}`);
  }
  redirect(`/admin/clients/${encodeURIComponent(email)}`);
}

/** Back-office : crée un code promo. */
export async function adminCreatePromo(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const type = String(formData.get("type") ?? "percent");
  const value = Number(formData.get("value") ?? 0);
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();

  if (!code || value <= 0 || !["percent", "fixed"].includes(type)) {
    redirect("/admin/marketing?promoError=1");
  }
  await prisma.promoCode
    .create({
      data: {
        code,
        type,
        value,
        usageLimit: usageLimitRaw ? Number(usageLimitRaw) : null,
      },
    })
    .catch(() => {});
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing");
}

/** Back-office : active/désactive un code promo. */
export async function adminTogglePromo(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (id) {
    await prisma.promoCode.update({ where: { id }, data: { active } });
    revalidatePath("/admin/marketing");
  }
  redirect("/admin/marketing");
}

/** Back-office : supprime un code promo. */
export async function adminDeletePromo(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.promoCode.delete({ where: { id } }).catch(() => {});
    revalidatePath("/admin/marketing");
  }
  redirect("/admin/marketing");
}

/**
 * Back-office : envoie une campagne.
 * Audience : "all" (abonnés newsletter) ou un segment client (VIP, À risque…).
 */
export async function sendCampaign(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all");
  if (!subject || !body) redirect("/admin/marketing?error=1");

  let recipients: string[] = [];
  if (audience === "all") {
    const subs = await prisma.newsletterSubscriber.findMany();
    recipients = subs.map((s) => s.email);
  } else {
    // Audience = segment client.
    const { listCustomers } = await import("@/lib/customers");
    const customers = await listCustomers();
    recipients = customers
      .filter((c) => c.segment === audience)
      .map((c) => c.email);
  }

  const html = `<div>${body.replace(/\n/g, "<br>")}</div>`;
  for (const to of recipients) {
    await sendEmail({ to, subject, html });
  }

  revalidatePath("/admin/marketing");
  redirect(`/admin/marketing?sent=${recipients.length}`);
}

/** Génère un slug URL à partir d'un texte. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Lit le champ « stock du jour » : vide = illimité (null), sinon entier ≥ 0. */
function parseDailyStock(raw: FormDataEntryValue | null): number | null {
  const value = String(raw ?? "").trim();
  if (value === "") return null;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Back-office : crée un plat. */
export async function adminCreateDish(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const parsed = dishSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    image: formData.get("image"),
    tag: formData.get("tag") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    available: formData.get("available") === "on",
  });
  if (!parsed.success) redirect("/admin/menu?error=1");

  const base = slugify(parsed.data.name) || "plat";
  let slug = base;
  let n = 1;
  // Garantit l'unicité du slug.
  while (await prisma.dish.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`;
  }
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const prepMinutes = Number(formData.get("prepMinutes") ?? 15) || 15;
  const dailyStock = parseDailyStock(formData.get("dailyStock"));
  await prisma.dish.create({
    data: {
      slug,
      ...parsed.data,
      tag: parsed.data.tag ?? null,
      categoryId,
      prepMinutes,
      dailyStock,
    },
  });
  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

/** Back-office : met à jour un plat (par id). */
export async function adminUpdateDish(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const parsed = dishSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    image: formData.get("image"),
    tag: formData.get("tag") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    available: formData.get("available") === "on",
  });
  if (!id || !parsed.success) redirect("/admin/menu?error=1");

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const prepMinutes = Number(formData.get("prepMinutes") ?? 15) || 15;
  const dailyStock = parseDailyStock(formData.get("dailyStock"));
  await prisma.dish.update({
    where: { id },
    data: {
      ...parsed.data,
      tag: parsed.data.tag ?? null,
      categoryId,
      prepMinutes,
      dailyStock,
    },
  });
  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

/** Back-office : met à jour les horaires d'ouverture d'un jour. */
export async function adminUpdateHours(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const closed = formData.get("closed") === "on";
  const open = String(formData.get("open") ?? "11:00");
  const close = String(formData.get("close") ?? "23:00");
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  if (!Number.isNaN(dayOfWeek)) {
    await prisma.openingHour.upsert({
      where: { dayOfWeek },
      update: { closed, openMinutes: toMin(open), closeMinutes: toMin(close) },
      create: {
        dayOfWeek,
        closed,
        openMinutes: toMin(open),
        closeMinutes: toMin(close),
      },
    });
    revalidatePath("/admin/parametres");
  }
  redirect("/admin/parametres");
}

/** Back-office : règle l'intervalle / délai / capacité des créneaux. */
export async function adminUpdateOrderingSettings(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const data = {
    slotIntervalMin: Number(formData.get("slotIntervalMin") ?? 15),
    leadTimeMin: Number(formData.get("leadTimeMin") ?? 20),
    capacityPerSlot: Number(formData.get("capacityPerSlot") ?? 8),
    imminentMin: Number(formData.get("imminentMin") ?? 5),
    prepMaxMin: Number(formData.get("prepMaxMin") ?? 10),
    stageMaxMin: Number(formData.get("stageMaxMin") ?? 5),
  };
  await prisma.orderingSetting.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  revalidatePath("/admin/parametres");
  redirect("/admin/parametres");
}

/** Back-office : ajoute un restaurant (socle multi-restaurant). */
export async function adminCreateRestaurant(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const active = formData.get("active") !== "false";

  if (!name) redirect("/admin/parametres?restaurantError=missing-name");

  const baseSlug = slugify(slugInput || name) || `resto-${Date.now()}`;
  let slug = baseSlug;
  let n = 1;
  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  await prisma.restaurant.create({ data: { name, slug, active } });
  revalidatePath("/admin/parametres");
  redirect("/admin/parametres?restaurantSaved=1");
}

/** Back-office : enregistre l'ID Stripe Connect d'un restaurant. */
export async function adminUpdateRestaurantStripeAccount(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const stripeAccountIdRaw = String(
    formData.get("stripeAccountId") ?? "",
  ).trim();
  const stripeAccountId = stripeAccountIdRaw || null;
  if (!id) redirect("/admin/parametres?stripeError=missing-restaurant");

  await prisma.restaurant.update({
    where: { id },
    data: {
      stripeAccountId,
      ...(stripeAccountId
        ? {}
        : {
            stripeDetailsSubmitted: false,
            stripeChargesEnabled: false,
            stripePayoutsEnabled: false,
            stripeOnboardingComplete: false,
            stripeLastSyncedAt: null,
          }),
    },
  });

  if (stripeAccountId && isStripeConnectConfigured()) {
    await syncRestaurantStripeStatus(id).catch(() => {});
  }

  revalidatePath("/admin/parametres");
  redirect("/admin/parametres?stripeSaved=1");
}

/** Back-office : ouvre le parcours Stripe Connect Express d'un restaurant. */
export async function adminOpenRestaurantStripeOnboarding(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  if (!isStripeConnectConfigured()) {
    redirect("/admin/parametres?stripeError=missing-secret");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/parametres?stripeError=missing-restaurant");

  try {
    const onboardingUrl = await createRestaurantOnboardingLink(id);
    redirect(onboardingUrl);
  } catch (error) {
    console.error("[stripe:connect:onboarding]", error);
    redirect("/admin/parametres?stripeError=onboarding");
  }
}

/** Back-office : synchronise l'état Stripe Connect d'un restaurant. */
export async function adminSyncRestaurantStripeStatus(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  if (!isStripeConnectConfigured()) {
    redirect("/admin/parametres?stripeError=missing-secret");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/parametres?stripeError=missing-restaurant");

  try {
    await syncRestaurantStripeStatus(id);
  } catch (error) {
    console.error("[stripe:connect:sync]", error);
    redirect("/admin/parametres?stripeError=sync");
  }

  revalidatePath("/admin/parametres");
  redirect("/admin/parametres?stripeSynced=1");
}

/** Back-office : ajoute un livreur. */
export async function adminCreateDriver(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  if (name) {
    await prisma.driver.create({ data: { name, phone } });
    revalidatePath("/admin/parametres");
  }
  redirect("/admin/parametres");
}

/** Back-office : active/désactive un livreur. */
export async function adminToggleDriver(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (id) {
    await prisma.driver.update({ where: { id }, data: { active } });
    revalidatePath("/admin/parametres");
  }
  redirect("/admin/parametres");
}

/**
 * Back-office : assigne un livreur à une commande et la passe « en livraison ».
 */
export async function adminAssignDriver(formData: FormData): Promise<void> {
  const email = await getSessionEmail();
  if (!isAdminEmail(email)) redirect("/compte");
  const reference = String(formData.get("reference") ?? "");
  const driverId = String(formData.get("driverId") ?? "") || null;
  if (reference) {
    const order = await prisma.order.update({
      where: { reference },
      data: { driverId },
      select: { status: true },
    });
    if (driverId && order.status === "prête") {
      await updateOrderStatus(reference, "en livraison", email ?? "admin");
    }
    revalidatePath("/admin/livraisons");
  }
  redirect("/admin/livraisons");
}

/** Back-office : relance un panier abandonné par email. */
export async function adminRelaunchCart(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const cart = id
    ? await prisma.abandonedCart.findUnique({ where: { id } })
    : null;
  if (cart?.email) {
    await sendEmail({
      to: cart.email,
      subject: `Votre panier vous attend chez ${siteConfig.shortName}`,
      html: `<h1>Vous avez oublié quelque chose ?</h1>
        <p>Votre panier (${cart.itemCount} article·s) est toujours là.</p>
        <p>Finalisez votre commande avec <strong>-10%</strong> grâce au code <strong>BOULANGERIE10</strong>.</p>
        <p><a href="${siteConfig.url}/commander">Reprendre ma commande</a></p>`,
    });
    await prisma.abandonedCart.update({
      where: { id },
      data: { status: "relancé" },
    });
    revalidatePath("/admin/paniers");
  }
  redirect("/admin/paniers");
}

/** Back-office : crée une catégorie de menu. */
export async function adminCreateCategory(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  if (name) {
    await prisma.category
      .create({
        data: { name, slug: slugify(name) || `cat-${Date.now()}`, sortOrder },
      })
      .catch(() => {});
    revalidatePath("/admin/menu");
  }
  redirect("/admin/menu");
}

/** Back-office : ajoute un groupe d'options à un plat. */
export async function adminAddOptionGroup(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const dishId = String(formData.get("dishId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "single");
  const required = formData.get("required") === "on";
  if (dishId && name) {
    await prisma.optionGroup.create({ data: { dishId, name, type, required } });
    revalidatePath("/admin/menu");
  }
  redirect("/admin/menu");
}

/** Back-office : ajoute une option à un groupe. */
export async function adminAddOption(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);
  if (groupId && name) {
    await prisma.option.create({ data: { groupId, name, priceDelta } });
    revalidatePath("/admin/menu");
  }
  redirect("/admin/menu");
}

/** Back-office : supprime un groupe d'options. */
export async function adminDeleteOptionGroup(
  formData: FormData,
): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.optionGroup.delete({ where: { id } }).catch(() => {});
    revalidatePath("/admin/menu");
  }
  redirect("/admin/menu");
}

/** Back-office : crée/modifie une zone de livraison. */
export async function adminUpsertZone(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const fee = Number(formData.get("fee") ?? 0);
  const minOrder = Number(formData.get("minOrder") ?? 0);
  if (postalCode) {
    await prisma.deliveryZone.upsert({
      where: { postalCode },
      update: { fee, minOrder },
      create: { postalCode, fee, minOrder },
    });
    revalidatePath("/admin/parametres");
  }
  redirect("/admin/parametres");
}

/** Back-office : supprime une zone de livraison. */
export async function adminDeleteZone(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.deliveryZone.delete({ where: { id } }).catch(() => {});
    revalidatePath("/admin/parametres");
  }
  redirect("/admin/parametres");
}

/** Back-office : supprime un plat. */
export async function adminDeleteDish(formData: FormData): Promise<void> {
  if (!isAdminEmail(await getSessionEmail())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.dish.delete({ where: { id } }).catch(() => {});
    revalidatePath("/admin/menu");
  }
  redirect("/admin/menu");
}

/** Transforme une ZodError en map champ → message. */
function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
