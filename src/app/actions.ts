"use server";

import crypto from "node:crypto";
import { z } from "zod";
import type { OrderLine } from "@/types";
import {
  antiWasteSchema,
  cateringSchema,
  contactSchema,
  customQuoteSchema,
  categorySchema,
  dishSchema,
  priceSchema,
  newsletterSchema,
  orderSchema,
  reservationSchema,
  reviewSchema,
  seasonalPreorderSchema,
} from "@/lib/validation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createOrder,
  getOrderByReference,
  OrderCreationError,
  updateOrderStatus,
} from "@/lib/orders";
import { startCheckout } from "@/lib/payment";
import { upsertCustomer } from "@/lib/customers";
import {
  createSession,
  destroySession,
  getSessionEmail,
  isAdminSession,
} from "@/lib/session";
import {
  createMagicLink,
  isAdminEmail,
  isValidAdminPassword,
} from "@/lib/auth";
import type { OrderStatus } from "@/types";
import { sendEmail } from "@/lib/email";
import { rawHtml, safeHtml, safeUrl } from "@/lib/html";
import { roundCurrency } from "@/lib/utils";
import { planReorder } from "@/lib/menu-ordering";
import {
  CONTENT_SECTIONS,
  resolveIconName,
  resolveSection,
} from "@/lib/content-blocks";
import { isSafeMediaUrl } from "@/lib/media-rules";
import { parseHex } from "@/lib/palette";
import { getSiteConfig } from "@/lib/site-settings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { recordDemoLead } from "@/lib/demo-leads";
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
  await recordDemoLead({ source: "newsletter", email });

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });
  if (existing) {
    return { ok: true, message: "Vous êtes déjà inscrit·e. Merci !" };
  }
  await prisma.newsletterSubscriber.create({ data: { email } });

  // Automation : email de bienvenue.
  const siteConfig = await getSiteConfig();
  await sendEmail({
    to: email,
    subject: `Bienvenue chez ${siteConfig.shortName}`,
    html: `<h1>Bienvenue !</h1>
      <p>Merci de rejoindre la communauté ${siteConfig.name}.</p>
      <p>Profitez de <strong>-10%</strong> sur votre première commande avec le code <strong>BIENVENUE10</strong>.</p>`,
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
    phone: formData.get("phone"),
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
  await recordDemoLead({
    source: "contact",
    sourceId: msg.id,
    name: msg.name,
    email: msg.email,
    phone: msg.phone,
    message: msg.message,
  });

  const siteConfig = await getSiteConfig();
  await sendEmail({
    to: siteConfig.contact.email,
    subject: `Nouveau message de ${msg.name}`,
    html: safeHtml`<p><strong>${msg.name}</strong> (${msg.email}, ${msg.phone}) a écrit :</p><p>${msg.message}</p>`,
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
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.review.update({ where: { id }, data: { approved: true } });
    revalidatePath("/admin/avis");
  }
  redirect("/admin/avis");
}

/** Back-office : supprime un avis. */
export async function adminDeleteReview(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
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
  const reservation = await prisma.reservation.create({
    data: { reference: ref, ...parsed.data },
  });
  await recordDemoLead({
    source: "réservation",
    sourceId: reservation.reference,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    message: `${parsed.data.guests} personne(s) le ${parsed.data.date} à ${parsed.data.time}`,
  });
  await upsertCustomer(parsed.data.email, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  await sendEmail({
    to: parsed.data.email,
    subject: `Votre demande de réservation ${ref}`,
    html: safeHtml`<h1>Merci ${parsed.data.name} !</h1>
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

  const request = await prisma.cateringRequest.create({ data: parsed.data });
  await recordDemoLead({
    source: "traiteur",
    sourceId: request.id,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    message: `${parsed.data.guests} convives${parsed.data.eventDate ? ` le ${parsed.data.eventDate}` : ""}`,
  });
  await upsertCustomer(parsed.data.email, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  const siteConfig = await getSiteConfig();
  await sendEmail({
    to: siteConfig.contact.email,
    subject: `Nouvelle demande traiteur de ${parsed.data.name}`,
    html: safeHtml`<p><strong>${parsed.data.name}</strong> (${parsed.data.email}, ${parsed.data.phone})
      pour ${parsed.data.guests} convives${parsed.data.eventDate ? ` le ${parsed.data.eventDate}` : ""} :</p>
      <p>${parsed.data.message}</p>`,
  });

  return {
    ok: true,
    message: "Demande de devis envoyée ! Nous revenons vers vous rapidement.",
  };
}

/** Demande de devis sur-mesure. */
export async function requestCustomQuote(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (isBot(formData)) return { ok: true, message: "Demande envoyée !" };
  if (!(await rateLimit(`custom-quote:${await clientIp()}`, 5, 60_000)))
    return TOO_MANY;

  const parsed = customQuoteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    occasion: formData.get("occasion"),
    servings: formData.get("servings"),
    preferences: formData.get("preferences"),
    message: formData.get("message") || undefined,
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

  const ref = `SM-${Date.now().toString(36).toUpperCase()}`;
  const request = await prisma.customRequest.create({
    data: { reference: ref, ...parsed.data },
  });
  await recordDemoLead({
    source: "sur-mesure",
    sourceId: request.reference,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    message: `${parsed.data.occasion} · ${parsed.data.servings} convives`,
  });
  await upsertCustomer(parsed.data.email, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  const siteConfig = await getSiteConfig();
  await sendEmail({
    to: siteConfig.contact.email,
    subject: `Nouvelle demande sur-mesure de ${parsed.data.name} (${ref})`,
    html: safeHtml`<p><strong>${parsed.data.name}</strong> (${parsed.data.email}, ${parsed.data.phone})</p>
      <ul>
        <li>Occasion : ${parsed.data.occasion}</li>
        <li>Convives : ${parsed.data.servings}</li>
        <li>Préférences : ${parsed.data.preferences}</li>
        <li>Retrait : ${parsed.data.pickupDate}${parsed.data.pickupTime ? ` à ${parsed.data.pickupTime}` : ""}</li>
        ${parsed.data.message ? rawHtml(safeHtml`<li>Message : ${parsed.data.message}</li>`) : ""}
        ${parsed.data.budget ? rawHtml(safeHtml`<li>Budget indicatif : ${parsed.data.budget}</li>`) : ""}
        ${parsed.data.allergies ? rawHtml(safeHtml`<li>Allergies : ${parsed.data.allergies}</li>`) : ""}
        ${parsed.data.inspirationUrl ? rawHtml(safeHtml`<li>Inspiration : <a href="${safeUrl(parsed.data.inspirationUrl)}">${parsed.data.inspirationUrl}</a></li>`) : ""}
      </ul>
      <p>${parsed.data.details}</p>`,
  });
  await sendEmail({
    to: parsed.data.email,
    subject: `Votre demande sur-mesure ${ref}`,
    html: safeHtml`<h1>Merci ${parsed.data.name} !</h1>
      <p>Votre demande sur-mesure pour le ${parsed.data.pickupDate}
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
    await recordDemoLead({
      source: "saison",
      sourceId: preorder.reference,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: `${preorder.quantity} × ${product.name} · retrait ${parsed.data.pickupDate}`,
    });
    await upsertCustomer(parsed.data.email, {
      name: parsed.data.name,
      phone: parsed.data.phone,
    });

    await sendEmail({
      to: parsed.data.email,
      subject: `Votre précommande ${preorder.reference} — ${product.name}`,
      html: safeHtml`<h1>Merci ${parsed.data.name} !</h1>
        <p>Votre précommande de ${preorder.quantity} × ${product.name}
        (réf. ${preorder.reference}) est confirmée, à retirer le
        ${parsed.data.pickupDate}. Paiement au retrait en boutique.</p>`,
    });
    const siteConfig = await getSiteConfig();
    await sendEmail({
      to: siteConfig.contact.email,
      subject: `Nouvelle précommande ${product.name} (${preorder.reference})`,
      html: safeHtml`<p>${parsed.data.name} (${parsed.data.email}, ${parsed.data.phone})
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
    await recordDemoLead({
      source: "anti-gaspi",
      sourceId: reservation.reference,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: `${reservation.quantity} panier(s) · ${offer.title}`,
    });
    await upsertCustomer(parsed.data.email, {
      name: parsed.data.name,
      phone: parsed.data.phone,
    });

    await sendEmail({
      to: parsed.data.email,
      subject: `Votre panier anti-gaspi ${reservation.reference}`,
      html: safeHtml`<h1>Merci ${parsed.data.name} !</h1>
        <p>Vous avez réservé ${reservation.quantity} panier(s) anti-gaspi
        (réf. ${reservation.reference}). Retrait ce soir entre
        ${offer.pickupStart} et ${offer.pickupEnd}. Paiement sur place.</p>`,
    });
    const siteConfig = await getSiteConfig();
    await sendEmail({
      to: siteConfig.contact.email,
      subject: `Nouvelle réservation anti-gaspi (${reservation.reference})`,
      html: safeHtml`<p>${parsed.data.name} (${parsed.data.email}, ${parsed.data.phone})
        a réservé ${reservation.quantity} panier(s) pour ce soir.</p>
        ${
          parsed.data.message
            ? rawHtml(
                safeHtml`<p><strong>Message client :</strong> ${parsed.data.message}</p>`,
              )
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
  // Anti-abus : honeypot + rate-limit + cap de taille — alignés sur /api/orders,
  // car cette action envoie email + SMS (coût Twilio) et décrémente le stock.
  if (isBot(formData)) return { ok: true, message: "Commande enregistrée." };
  if (!(await rateLimit(`order:${await clientIp()}`, 5, 10 * 60_000)))
    return TOO_MANY;

  const rawItems = String(formData.get("items") ?? "[]");
  if (rawItems.length > 64 * 1024) {
    return { ok: false, message: "Panier trop volumineux." };
  }
  let items: OrderLine[] = [];
  try {
    items = JSON.parse(rawItems);
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
  // Anti-énumération : borne les essais de codes (l'oracle valide/expiré/épuisé
  // + le montant de remise ne doivent pas être testables en masse).
  if (!(await rateLimit(`promo:${await clientIp()}`, 10, 60_000))) {
    return { ok: false, message: "Trop de tentatives. Réessayez plus tard." };
  }
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
  // Réservé au propriétaire connecté (ou admin) : ne pas réexposer le détail
  // d'une commande d'autrui à quiconque détient/devine une référence.
  const sessionEmail = await getSessionEmail();
  if (!sessionEmail) return [];
  const { getOrderByReference } = await import("@/lib/orders");
  const order = await getOrderByReference(reference);
  if (!order) return [];
  if (
    order.customer.email.toLowerCase() !== sessionEmail.toLowerCase() &&
    !(await isAdminSession())
  ) {
    return [];
  }

  const slugs = order.items.map((i) => i.id);
  const dishes = await prisma.dish.findMany({ where: { slug: { in: slugs } } });
  const imageBySlug = new Map(dishes.map((d) => [d.slug, d.image]));

  return order.items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: imageBySlug.get(i.id) ?? "/images/africain/thiep-poisson.webp",
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
  const { isOnlineOrderingEnabled } = await import("@/lib/online-ordering");
  if (!(await isOnlineOrderingEnabled())) {
    redirect(`/commande/${reference}?payment=disabled`);
  }
  // Anti-abus : borne le déclenchement de paiement (spam checkout / simulation).
  if (!(await rateLimit(`pay:${await clientIp()}`, 10, 60_000))) {
    redirect(`/commande/${reference}?error=throttle`);
  }
  const order = await getOrderByReference(reference);
  if (!order) redirect("/");
  if (order.status !== "en attente") {
    redirect(`/commande/${reference}`);
  }

  // Un utilisateur connecté ne peut payer QUE sa propre commande (ou admin).
  // Un invité (sans session) reste autorisé via la référence-capacité (80 bits).
  const sessionEmail = await getSessionEmail();
  if (
    sessionEmail &&
    sessionEmail.toLowerCase() !== order.customer.email.toLowerCase() &&
    !(await isAdminSession())
  ) {
    redirect(`/commande/${reference}`);
  }

  let result;
  try {
    result = await startCheckout(order);
  } catch (error) {
    const { PaymentConfigurationError } = await import("@/lib/payment");
    if (error instanceof PaymentConfigurationError) {
      redirect(`/commande/${reference}?payment=unavailable`);
    }
    throw error;
  }
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
  const targetEmail = parsed.data.email.toLowerCase();
  // Anti-bombing : limite aussi par email visé (au-delà de l'IP), pour qu'un
  // attaquant multi-IP ne puisse pas inonder la boîte d'une victime.
  if (!(await rateLimit(`login-email:${targetEmail}`, 5, 15 * 60_000)))
    return TOO_MANY;
  await createMagicLink(targetEmail);
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

  // Anti brute-force distribué : limite aussi par compte admin ciblé (au-delà
  // de la limite par IP), pour ralentir une attaque répartie sur plusieurs IP.
  if (
    !(await rateLimit(
      `admin-login-email:${parsed.data.email}`,
      10,
      15 * 60_000,
    ))
  ) {
    return TOO_MANY;
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

  // Rôle admin accordé UNIQUEMENT ici (après vérification du mot de passe).
  await createSession(parsed.data.email, "admin");
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
  const code = `FID-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const redeemed = await prisma.$transaction(async (tx) => {
    const debit = await tx.customer.updateMany({
      where: { email, loyaltyPoints: { gte: POINTS_PER_REDEMPTION } },
      data: { loyaltyPoints: { decrement: POINTS_PER_REDEMPTION } },
    });
    if (debit.count !== 1) return false;
    await tx.promoCode.create({
      data: {
        code,
        type: "fixed",
        value: REDEMPTION_VALUE_EUR,
        active: true,
        usageLimit: 1,
      },
    });
    return true;
  });
  if (!redeemed) redirect("/compte?fid=insuffisant");
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
  if (!(await isAdminSession())) redirect("/compte");

  const reference = String(formData.get("reference") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const backRaw = String(formData.get("back") ?? "/admin/commandes");
  // Anti open-redirect : n'accepte qu'un chemin interne admin (pas d'URL absolue,
  // pas de `//host`).
  const back =
    backRaw.startsWith("/admin") && !backRaw.startsWith("//")
      ? backRaw
      : "/admin/commandes";
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
  if (!(await isAdminSession())) redirect("/compte");

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
const CUSTOM_QUOTE_STATUSES = [
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && CATERING_STATUSES.includes(status)) {
    await prisma.cateringRequest.update({ where: { id }, data: { status } });
    revalidatePath("/admin/traiteur");
  }
  redirect("/admin/traiteur");
}

/** Back-office : change le statut d'une demande sur-mesure. */
export async function adminSetCustomQuoteStatus(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && CUSTOM_QUOTE_STATUSES.includes(status)) {
    await prisma.customRequest.update({ where: { id }, data: { status } });
    revalidatePath("/admin/sur-mesure");
  }
  redirect("/admin/sur-mesure");
}

/** Back-office : crée une offre de saison (précommandes). */
export async function adminCreateSeasonalProduct(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
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
      image: image || "/images/africain/desserts-africains.webp",
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
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/saison?error=1");
  await prisma.seasonalProduct.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      image:
        String(formData.get("image") ?? "").trim() ||
        "/images/africain/desserts-africains.webp",
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");

  const email = String(formData.get("email") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const birthDateRaw = String(formData.get("birthDate") ?? "").trim();
  const birthDate = birthDateRaw
    ? new Date(`${birthDateRaw}T00:00:00.000Z`)
    : null;

  if (email) {
    const { updateCustomerCrm } = await import("@/lib/customers");
    await updateCustomerCrm(
      email,
      notes,
      tags,
      birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
    );
    revalidatePath(`/admin/clients/${encodeURIComponent(email)}`);
  }
  redirect(`/admin/clients/${encodeURIComponent(email)}`);
}

/** Back-office : crée un code promo. */
export async function adminCreatePromo(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");

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

  const consented = new Set(
    (
      await prisma.newsletterSubscriber.findMany({ select: { email: true } })
    ).map((subscriber) => subscriber.email.toLowerCase()),
  );
  recipients = [
    ...new Set(recipients.map((email) => email.toLowerCase())),
  ].filter((email) => consented.has(email));
  const runKey = crypto.randomBytes(8).toString("hex");
  const { dispatchMarketingCampaign } =
    await import("@/lib/marketing-automation");
  const sent = await dispatchMarketingCampaign({
    name: `Campagne manuelle — ${subject}`,
    type: "manual",
    subject,
    body,
    promoCode:
      String(formData.get("promoCode") ?? "")
        .trim()
        .toUpperCase() || null,
    recipients: recipients.map((email) => ({
      email,
      dedupeKey: `manual:${runKey}:${email}`,
    })),
  });

  revalidatePath("/admin/marketing");
  redirect(`/admin/marketing?sent=${sent}`);
}

/** Back-office : met à jour et active/désactive une règle marketing. */
export async function adminUpdateMarketingRule(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!id || !subject || !body) redirect("/admin/marketing?ruleError=1");
  const weekdayRaw = String(formData.get("weekday") ?? "").trim();
  const delayRaw = String(formData.get("delayDays") ?? "").trim();
  const promoCode = String(formData.get("promoCode") ?? "")
    .trim()
    .toUpperCase();
  const enabled = formData.get("enabled") === "on";
  if (
    enabled &&
    promoCode &&
    !(await prisma.promoCode.findFirst({
      where: { code: promoCode, active: true },
      select: { id: true },
    }))
  ) {
    redirect("/admin/marketing?ruleError=promo");
  }
  const parsedDelay = Number(delayRaw);
  const parsedWeekday = Number(weekdayRaw);
  await prisma.marketingRule.update({
    where: { id },
    data: {
      enabled,
      subject,
      body,
      promoCode: promoCode || null,
      delayDays:
        delayRaw && Number.isFinite(parsedDelay)
          ? Math.max(1, Math.round(parsedDelay))
          : null,
      weekday:
        weekdayRaw && Number.isFinite(parsedWeekday)
          ? Math.min(6, Math.max(0, Math.round(parsedWeekday)))
          : null,
    },
  });
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing?ruleSaved=1");
}

/** Back-office : exécute immédiatement toutes les règles actives. */
export async function adminRunMarketingAutomations(): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const { runMarketingAutomations } =
    await import("@/lib/marketing-automation");
  const results = await runMarketingAutomations();
  const sent = results.reduce((sum, result) => sum + result.sent, 0);
  revalidatePath("/admin/marketing");
  redirect(`/admin/marketing?automated=${sent}`);
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
  if (!(await isAdminSession())) redirect("/compte");
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
      featured: formData.get("featured") === "on",
    },
  });
  revalidateMenu();
  redirect("/admin/menu?saved=plat");
}

/** Back-office : met à jour un plat (par id). */
export async function adminUpdateDish(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
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
      featured: formData.get("featured") === "on",
    },
  });
  revalidateMenu();
  redirect("/admin/menu?saved=plat");
}

/** Back-office : met à jour les horaires d'ouverture d'un jour. */
export async function adminUpdateHours(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
  const data = {
    onlineOrderingEnabled: formData.get("onlineOrderingEnabled") === "on",
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
  revalidatePath("/", "layout");
  revalidatePath("/commander");
  revalidatePath("/commande/[reference]", "page");
  redirect("/admin/parametres");
}

/** Back-office : choisit la palette d'accent globale du site public. */
export async function adminUpdateColorPalette(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte?admin=1");

  const parsed = z
    .enum(["ambre", "terracotta", "emeraude", "perso"])
    .safeParse(formData.get("palette"));
  if (!parsed.success) redirect("/admin/parametres?paletteError=invalid");

  // En mode « perso », la couleur libre doit être un hexadécimal valide : sans
  // elle, le site retomberait silencieusement sur l'ambre.
  const accentColor = optionalText(formData.get("accentColor"));
  if (parsed.data === "perso" && !(accentColor && parseHex(accentColor))) {
    redirect("/admin/parametres?paletteError=couleur");
  }

  await prisma.$transaction([
    prisma.orderingSetting.upsert({
      where: { id: "default" },
      update: { colorPalette: parsed.data },
      create: { id: "default", colorPalette: parsed.data },
    }),
    prisma.siteSetting.upsert({
      where: { id: "default" },
      update: { accentColor },
      create: { id: "default", accentColor },
    }),
  ]);
  revalidatePath("/", "layout");
  revalidatePath("/admin/parametres");
  redirect("/admin/parametres?paletteSaved=1");
}

/** Renvoie la chaîne nettoyée, ou `null` si vide (→ fallback sur les défauts). */
function optionalText(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : null;
}

/**
 * Idem pour un chemin de média : une valeur hors médiathèque est ramenée à
 * `null` plutôt que d'enregistrer un logo ou un favicon qui ne s'afficherait
 * pas (CSP `img-src 'self'`, `next/image` sans `remotePatterns`).
 */
function optionalMedia(value: FormDataEntryValue | null): string | null {
  const chemin = optionalText(value);
  return chemin && isSafeMediaUrl(chemin) ? chemin : null;
}

/**
 * Back-office : met à jour l'identité du restaurant (nom, coordonnées, réseaux…)
 * éditable sans toucher au code. Champs vides → on retombe sur `defaultSiteConfig`.
 */
export async function adminUpdateSiteIdentity(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte?admin=1");

  const email = optionalText(formData.get("email"));
  if (email && !z.string().email().safeParse(email).success) {
    redirect("/admin/parametres?identityError=email");
  }

  const data = {
    name: optionalText(formData.get("name")),
    shortName: optionalText(formData.get("shortName")),
    description: optionalText(formData.get("description")),
    phone: optionalText(formData.get("phone")),
    email,
    address: optionalText(formData.get("address")),
    city: optionalText(formData.get("city")),
    facebook: optionalText(formData.get("facebook")),
    instagram: optionalText(formData.get("instagram")),
    tiktok: optionalText(formData.get("tiktok")),
    whatsappNumber: optionalText(formData.get("whatsappNumber")),
    telegramUsername: optionalText(formData.get("telegramUsername")),
    hoursSummary: optionalText(formData.get("hoursSummary")),

    // Image de marque : les médias doivent venir de la médiathèque.
    logoUrl: optionalMedia(formData.get("logoUrl")),
    faviconUrl: optionalMedia(formData.get("faviconUrl")),
    ogImageUrl: optionalMedia(formData.get("ogImageUrl")),
    tagline: optionalText(formData.get("tagline")),

    metaTitle: optionalText(formData.get("metaTitle")),
    metaDescription: optionalText(formData.get("metaDescription")),
    keywords: optionalText(formData.get("keywords")),

    legalCompany: optionalText(formData.get("legalCompany")),
    legalStatus: optionalText(formData.get("legalStatus")),
    legalCapital: optionalText(formData.get("legalCapital")),
    legalSiret: optionalText(formData.get("legalSiret")),
    legalVat: optionalText(formData.get("legalVat")),
    legalDirector: optionalText(formData.get("legalDirector")),
    legalHost: optionalText(formData.get("legalHost")),
  };

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/parametres");
  redirect("/admin/parametres?identitySaved=1");
}

/** Back-office : ajoute un restaurant (socle multi-restaurant). */
export async function adminCreateRestaurant(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const cart = id
    ? await prisma.abandonedCart.findUnique({ where: { id } })
    : null;
  if (cart?.email) {
    const siteConfig = await getSiteConfig();
    await sendEmail({
      to: cart.email,
      subject: `Votre panier vous attend chez ${siteConfig.shortName}`,
      html: `<h1>Vous avez oublié quelque chose ?</h1>
        <p>Votre panier (${cart.itemCount} article·s) est toujours là.</p>
        <p>Finalisez votre commande avec <strong>-10%</strong> grâce au code <strong>BIENVENUE10</strong>.</p>
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

/**
 * Invalide tout ce qui dépend de la carte après une modification au CRM :
 * l'écran d'administration, l'accueil (spécialités), la carte, les fiches
 * produit et le plan du site. Sans cela, un changement de prix ou de photo
 * pourrait rester invisible jusqu'au prochain déploiement.
 */
function revalidateMenu(): void {
  revalidatePath("/admin/menu");
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/menu/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

/** Lit les champs communs d'une catégorie depuis le formulaire. */
function categoryFields(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? "").trim() || undefined,
    image: String(formData.get("image") ?? "").trim() || undefined,
    active: formData.get("active") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

/** Back-office : crée une catégorie de menu. */
export async function adminCreateCategory(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const parsed = categoryFields(formData);
  if (!parsed.success) redirect("/admin/menu?error=categorie");

  const base = slugify(parsed.data.name) || "categorie";
  let slug = base;
  let n = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`;
  }

  await prisma.category.create({
    data: {
      slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      image: parsed.data.image ?? null,
      active: parsed.data.active,
      sortOrder: parsed.data.sortOrder,
    },
  });
  revalidateMenu();
  redirect("/admin/menu?saved=categorie");
}

/** Back-office : modifie une catégorie (nom, accroche, bannière, visibilité). */
export async function adminUpdateCategory(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const parsed = categoryFields(formData);
  if (!id || !parsed.success) redirect("/admin/menu?error=categorie");

  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      image: parsed.data.image ?? null,
      active: parsed.data.active,
      sortOrder: parsed.data.sortOrder,
    },
  });
  revalidateMenu();
  redirect("/admin/menu?saved=categorie");
}

/**
 * Back-office : supprime une catégorie.
 *
 * Refuse tant qu'elle contient des plats — sauf case « détacher » cochée, qui
 * les rend « sans catégorie » plutôt que de les supprimer avec elle. Un plat ne
 * doit jamais disparaître par effet de bord d'un ménage de catégories.
 */
export async function adminDeleteCategory(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/menu");

  const dishes = await prisma.dish.count({ where: { categoryId: id } });
  if (dishes > 0 && formData.get("detach") !== "on") {
    redirect(`/admin/menu?error=categorie-occupee&plats=${dishes}`);
  }
  if (dishes > 0) {
    await prisma.dish.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
  }
  await prisma.category.delete({ where: { id } }).catch(() => {});
  revalidateMenu();
  redirect("/admin/menu?saved=categorie-supprimee");
}

/**
 * Déplace une ligne d'un cran (catégorie ou plat) puis **renumérote toute la
 * liste**, en une seule transaction.
 *
 * Renuméroter l'intégralité n'est pas un luxe : les `sortOrder` en base vivent
 * sur une échelle quelconque (1..n pour les seeds, valeur libre saisie au CRM,
 * doublons créés par la duplication d'un plat). N'écrire que les deux lignes
 * échangées les projetterait sur l'échelle des rangs et les ferait sauter
 * devant leurs voisines — « monter » une catégorie pouvait ainsi l'envoyer en
 * première position. La transaction évite d'exposer un ordre à moitié réécrit.
 */
async function moveInList(
  rows: { id: string; sortOrder: number }[],
  id: string,
  direction: "up" | "down",
  persist: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
): Promise<void> {
  // Le calcul vit dans le module pur `menu-ordering.ts` (et y est testé) ;
  // ici on ne fait qu'écrire, en une transaction pour ne jamais exposer un
  // ordre à moitié réécrit.
  const plan = planReorder(rows, id, direction);
  if (plan.length === 0) return;
  await prisma.$transaction(
    plan.map((entree) => persist(entree.id, entree.sortOrder)),
  );
}

/** Back-office : monte ou descend une catégorie dans la carte. */
export async function adminMoveCategory(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";

  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, sortOrder: true },
  });
  await moveInList(rows, id, direction, (rowId, sortOrder) =>
    prisma.category.update({ where: { id: rowId }, data: { sortOrder } }),
  );
  revalidateMenu();
  redirect("/admin/menu");
}

/** Back-office : monte ou descend un plat dans sa catégorie. */
export async function adminMoveDish(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";

  const dish = await prisma.dish.findUnique({
    where: { id },
    select: { categoryId: true },
  });
  if (!dish) redirect("/admin/menu");

  const rows = await prisma.dish.findMany({
    where: { categoryId: dish.categoryId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, sortOrder: true },
  });
  await moveInList(rows, id, direction, (rowId, sortOrder) =>
    prisma.dish.update({ where: { id: rowId }, data: { sortOrder } }),
  );
  revalidateMenu();
  redirect("/admin/menu");
}

/** Back-office : duplique un plat (base de travail pour une variante). */
export async function adminDuplicateDish(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const source = await prisma.dish.findUnique({
    where: { id },
    include: { optionGroups: { include: { options: true } } },
  });
  if (!source) redirect("/admin/menu");

  const base = `${slugify(source.name)}-copie`;
  let slug = base;
  let n = 1;
  while (await prisma.dish.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`;
  }

  const copie = await prisma.dish.create({
    data: {
      slug,
      name: `${source.name} (copie)`,
      description: source.description,
      price: source.price,
      image: source.image,
      tag: source.tag,
      categoryId: source.categoryId,
      prepMinutes: source.prepMinutes,
      dailyStock: source.dailyStock,
      sortOrder: source.sortOrder + 1,
      // Une copie n'est ni publiée ni mise en avant : l'admin la relit d'abord.
      available: false,
      featured: false,
    },
  });

  // Les options font partie du produit : une copie sans elles serait un piège.
  for (const groupe of source.optionGroups) {
    await prisma.optionGroup.create({
      data: {
        dishId: copie.id,
        name: groupe.name,
        type: groupe.type,
        required: groupe.required,
        sortOrder: groupe.sortOrder,
        options: {
          create: groupe.options.map((option) => ({
            name: option.name,
            priceDelta: option.priceDelta,
            sortOrder: option.sortOrder,
          })),
        },
      },
    });
  }

  revalidateMenu();
  redirect("/admin/menu?saved=duplication");
}

/** Back-office : modifie uniquement le prix d'un plat (édition en ligne). */
export async function adminUpdateDishPrice(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const parsed = priceSchema.safeParse(formData.get("price"));
  if (!id || !parsed.success) redirect("/admin/menu?error=prix");

  await prisma.dish.update({
    where: { id },
    data: { price: roundCurrency(parsed.data) },
  });
  revalidateMenu();
  redirect("/admin/menu?saved=prix");
}

/** Back-office : bascule la mise en avant d'un plat (accueil + badge carte). */
export async function adminToggleDishFeatured(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const dish = await prisma.dish.findUnique({
    where: { id },
    select: { featured: true },
  });
  if (dish) {
    await prisma.dish.update({
      where: { id },
      data: { featured: !dish.featured },
    });
    revalidateMenu();
  }
  redirect("/admin/menu");
}

/** Back-office : ajoute un groupe d'options à un plat. */
export async function adminAddOptionGroup(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const dishId = String(formData.get("dishId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "single");
  const required = formData.get("required") === "on";
  if (dishId && name) {
    await prisma.optionGroup.create({ data: { dishId, name, type, required } });
    revalidateMenu();
  }
  redirect("/admin/menu");
}

/** Back-office : ajoute une option à un groupe. */
export async function adminAddOption(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);
  if (groupId && name) {
    await prisma.option.create({ data: { groupId, name, priceDelta } });
    revalidateMenu();
  }
  redirect("/admin/menu");
}

/** Back-office : renomme / reconfigure un groupe d'options. */
export async function adminUpdateOptionGroup(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = formData.get("type") === "multi" ? "multi" : "single";
  const required = formData.get("required") === "on";
  if (id && name) {
    await prisma.optionGroup.update({
      where: { id },
      data: { name, type, required },
    });
    revalidateMenu();
  }
  redirect("/admin/menu");
}

/** Back-office : supprime un groupe d'options (et ses options, en cascade). */
export async function adminDeleteOptionGroup(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.optionGroup.delete({ where: { id } }).catch(() => {});
    revalidateMenu();
  }
  redirect("/admin/menu");
}

/** Back-office : modifie une option (libellé et supplément). */
export async function adminUpdateOption(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const parsed = z.coerce
    .number()
    .min(-10_000)
    .max(10_000)
    .safeParse(formData.get("priceDelta") ?? 0);
  if (id && name && parsed.success) {
    await prisma.option.update({
      where: { id },
      data: { name, priceDelta: roundCurrency(parsed.data) },
    });
    revalidateMenu();
  }
  redirect("/admin/menu");
}

/** Back-office : supprime une option d'un groupe. */
export async function adminDeleteOption(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.option.delete({ where: { id } }).catch(() => {});
    revalidateMenu();
  }
  redirect("/admin/menu");
}

// ─── Contenus éditoriaux (/admin/contenus) ──────────────────────────────────

/** Invalide toutes les pages publiques après une modification de contenu. */
function revalidateContenus(): void {
  revalidatePath("/", "layout");
}

/** Champ texte du formulaire : chaîne nettoyée, ou `null` si vide. */
function texteOuNull(value: FormDataEntryValue | null): string | null {
  const texte = typeof value === "string" ? value.trim() : "";
  return texte.length ? texte : null;
}

/**
 * Back-office : enregistre un bloc de contenu.
 *
 * Écrit TOUS les champs du formulaire : une fois le bloc repris en main depuis
 * le CRM, c'est la base qui fait autorité (voir `resolveSection`), donc laisser
 * un champ vide doit bien le vider — pas retomber silencieusement sur le
 * modèle. La section et le média sont validés avant écriture.
 */
export async function adminSaveContentBlock(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");

  const section = String(formData.get("section") ?? "");
  const key = String(formData.get("key") ?? "").trim();
  if (!CONTENT_SECTIONS.includes(section as never) || !key) {
    redirect("/admin/contenus?error=section");
  }

  const mediaUrl = texteOuNull(formData.get("mediaUrl"));
  const posterUrl = texteOuNull(formData.get("posterUrl"));
  for (const media of [mediaUrl, posterUrl]) {
    if (media && !isSafeMediaUrl(media)) {
      redirect(`/admin/contenus?section=${section}&error=media`);
    }
  }

  const donnees = {
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    active: formData.get("active") === "on",
    title: texteOuNull(formData.get("title")),
    subtitle: texteOuNull(formData.get("subtitle")),
    body: texteOuNull(formData.get("body")),
    mediaUrl,
    posterUrl,
    alt: texteOuNull(formData.get("alt")),
    href: texteOuNull(formData.get("href")),
    ctaLabel: texteOuNull(formData.get("ctaLabel")),
    icon: resolveIconName(texteOuNull(formData.get("icon"))) ?? null,
    data: texteOuNull(formData.get("tag"))
      ? { tag: texteOuNull(formData.get("tag")) }
      : Prisma.DbNull,
  };

  await prisma.contentBlock.upsert({
    where: { section_key: { section, key } },
    update: donnees,
    create: { section, key, ...donnees },
  });

  revalidateContenus();
  redirect(`/admin/contenus?section=${section}&saved=1`);
}

/**
 * Back-office : réinitialise un bloc au contenu du modèle.
 * Supprimer la ligne suffit — `resolveSection` retombe alors sur le défaut.
 */
export async function adminResetContentBlock(
  formData: FormData,
): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const section = String(formData.get("section") ?? "");
  const key = String(formData.get("key") ?? "");
  if (section && key) {
    await prisma.contentBlock
      .delete({ where: { section_key: { section, key } } })
      .catch(() => {});
    revalidateContenus();
  }
  redirect(`/admin/contenus?section=${section}&saved=reset`);
}

/** Back-office : monte ou descend un bloc dans sa section. */
export async function adminMoveContentBlock(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const section = String(formData.get("section") ?? "");
  const key = String(formData.get("key") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!section || !key) redirect("/admin/contenus");

  // L'ordre affiché mêle défauts et personnalisations : on part donc du
  // résultat résolu, puis on matérialise en base la nouvelle numérotation.
  const rows = await prisma.contentBlock.findMany({ where: { section } });
  const blocs = resolveSection(section, rows);
  const plan = planReorder(
    blocs.map((b) => ({ id: b.key, sortOrder: b.sortOrder })),
    key,
    direction,
  );
  if (plan.length === 0) redirect(`/admin/contenus?section=${section}`);

  const parCle = new Map(blocs.map((b) => [b.key, b]));
  await prisma.$transaction(
    plan.map((entree) => {
      const bloc = parCle.get(entree.id);
      return prisma.contentBlock.upsert({
        where: { section_key: { section, key: entree.id } },
        update: { sortOrder: entree.sortOrder },
        create: {
          section,
          key: entree.id,
          sortOrder: entree.sortOrder,
          active: bloc?.active ?? true,
          title: bloc?.title ?? null,
          subtitle: bloc?.subtitle ?? null,
          body: bloc?.body ?? null,
          mediaUrl: bloc?.mediaUrl ?? null,
          posterUrl: bloc?.posterUrl ?? null,
          alt: bloc?.alt ?? null,
          href: bloc?.href ?? null,
          ctaLabel: bloc?.ctaLabel ?? null,
          icon: bloc?.icon ?? null,
          data: bloc?.data
            ? (bloc.data as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
      });
    }),
  );

  revalidateContenus();
  redirect(`/admin/contenus?section=${section}`);
}

/** Back-office : crée/modifie une zone de livraison. */
export async function adminUpsertZone(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
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
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.deliveryZone.delete({ where: { id } }).catch(() => {});
    revalidatePath("/admin/parametres");
  }
  redirect("/admin/parametres");
}

/** Back-office : supprime un plat. */
export async function adminDeleteDish(formData: FormData): Promise<void> {
  if (!(await isAdminSession())) redirect("/compte");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.dish.delete({ where: { id } }).catch(() => {});
    revalidateMenu();
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
