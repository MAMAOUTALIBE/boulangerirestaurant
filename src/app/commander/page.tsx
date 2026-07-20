"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Clock3,
  CreditCard,
  MapPin,
  ShoppingBag,
  Pencil,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Lock,
  Sparkles,
  Star,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useOrderChoice } from "@/context/OrderContext";
import { placeOrder, checkPromo, checkDelivery } from "@/app/actions";
import { OrderStarter } from "@/components/OrderStarter";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { formatPrice } from "@/lib/utils";
import {
  buildTelegramOrderUrl,
  buildWhatsAppOrderUrl,
  formatSocialOrderMessage,
} from "@/lib/social-order";

const fieldClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";
const starterLinks = [
  {
    href: "/menu/adana-kebab",
    name: "Adana kebab",
    text: "Signature",
    image: "/images/hero-slide-adana-kebab.png",
  },
  {
    href: "/menu/iskender-kebab",
    name: "İskender kebab",
    text: "Populaire",
    image: "/images/hero-premium-kebab.png",
  },
  {
    href: "/menu/baklava",
    name: "Baklava",
    text: "Dessert",
    image: "/images/baklava.png",
  },
];
function buildCheckoutHighlights(city: string): {
  title: string;
  text: string;
  Icon: LucideIcon;
}[] {
  return [
    {
      title: "Créneau au choix",
      text: "Dès que possible ou horaire programmé.",
      Icon: Clock3,
    },
    {
      title: "Livraison ou retrait",
      text: `${city} et alentours.`,
      Icon: Truck,
    },
    {
      title: "Paiement sécurisé",
      text: "Validation claire avant paiement.",
      Icon: CreditCard,
    },
  ];
}

export default function CommanderPage() {
  const siteConfig = useSiteConfig();
  const { items, totalPrice, clear, cartId } = useCart();
  const { choice, clearChoice } = useOrderChoice();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const leadDraftRef = useRef({
    name: "",
    phone: "",
    email: "",
  });

  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Recalcule les frais de livraison à partir du choix mémorisé.
  useEffect(() => {
    if (choice?.fulfillment === "livraison" && choice.postalCode) {
      checkDelivery(choice.postalCode, totalPrice).then((r) =>
        setDeliveryFee(r.ok ? r.fee : 0),
      );
    } else {
      setDeliveryFee(0);
    }
  }, [choice, totalPrice]);

  const fee = choice?.fulfillment === "livraison" ? deliveryFee : 0;
  const tip = 0;
  const total = Math.max(0, totalPrice - discount) + fee + tip;
  const socialOrderMessage = choice
    ? formatSocialOrderMessage({
        items,
        choice,
        subtotal: totalPrice,
        deliveryFee: fee,
        discount,
        tip,
        total,
        promoCode: promo.trim() || undefined,
        restaurantName: siteConfig.name,
      })
    : "";
  const whatsappOrderUrl = socialOrderMessage
    ? buildWhatsAppOrderUrl(
        socialOrderMessage,
        siteConfig.messaging.whatsappOrderNumber,
      )
    : "#";
  const telegramOrderUrl = socialOrderMessage
    ? buildTelegramOrderUrl(
        socialOrderMessage,
        siteConfig.messaging.telegramOrderUsername,
        siteConfig.url,
      )
    : "#";

  function trackCheckoutLead(field: "name" | "phone" | "email", value: string) {
    const next = { ...leadDraftRef.current, [field]: value.trim() };
    leadDraftRef.current = next;
    if (!cartId || (!next.email && !next.phone)) return;

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId,
        name: next.name || undefined,
        phone: next.phone || undefined,
        email: next.email || undefined,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      }),
    }).catch(() => {});
  }

  async function applyPromo() {
    if (!promo.trim()) return;
    const r = await checkPromo(promo, totalPrice);
    setPromoMsg({ ok: r.ok, text: r.message });
    setDiscount(r.ok ? (r.discount ?? 0) : 0);
  }

  async function action(formData: FormData) {
    if (!choice) return;
    setSubmitting(true);
    setGlobalError(null);
    setErrors({});
    const lines = items.map((i) => ({
      id: i.dishId,
      name: i.name,
      price: i.unitPrice,
      quantity: i.quantity,
      options: i.options,
      note: i.note,
    }));
    formData.set("items", JSON.stringify(lines));
    formData.set("fulfillment", choice.fulfillment);
    formData.set("tip", String(tip));
    formData.set("cartId", cartId);
    if (choice.scheduledAt) formData.set("scheduledAt", choice.scheduledAt);
    if (choice.fulfillment === "livraison" && choice.postalCode) {
      formData.set("postalCode", choice.postalCode);
    }
    if (choice.fulfillment === "livraison" && choice.deliveryAddress) {
      formData.set("address", choice.deliveryAddress);
    }
    if (discount > 0 && promo.trim()) formData.set("promoCode", promo.trim());

    const result = await placeOrder(null, formData);
    if (result.ok && result.reference) {
      clear();
      clearChoice();
      window.location.assign(`/commande/${result.reference}`);
      return;
    }
    setErrors(result.errors ?? {});
    setGlobalError(result.message);
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-ink pb-20 pt-24 sm:pt-28 3xl:pt-36">
      <div className="container-page max-w-6xl 3xl:max-w-[1540px]">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au menu
        </Link>
        <h1 className="mt-5 font-display text-[1.75rem] font-bold leading-tight text-cream sm:mt-6 sm:text-4xl">
          Finaliser ma commande
        </h1>

        {items.length > 0 && <StepIndicator current={choice ? 2 : 1} />}

        {items.length === 0 ? (
          <EmptyCartState />
        ) : !choice ? (
          /* ÉTAPE 1 — mode + calendrier (entrée de commande) */
          <div className="mt-6 grid min-w-0 gap-6 sm:mt-8 lg:grid-cols-[minmax(0,1.1fr)_0.9fr] 3xl:grid-cols-[minmax(0,1.25fr)_0.85fr] 3xl:gap-8">
            <section className="min-w-0 rounded-2xl border border-white/10 bg-ink-soft p-4 sm:p-6">
              <OrderStarter
                subtotal={totalPrice}
                onConfirmed={() =>
                  window.scrollTo({ top: 0, behavior: "auto" })
                }
              />
            </section>
            <div className="hidden lg:block">
              <CheckoutHelpPanel subtotal={totalPrice} />
            </div>
          </div>
        ) : (
          /* ÉTAPE 2 — récap + coordonnées */
          <>
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/5 px-5 py-3">
              <div className="min-w-0 text-sm text-cream">
                <p className="font-semibold">{choice.label}</p>
                {choice.fulfillment === "livraison" &&
                  choice.deliveryAddress && (
                    <p className="mt-1 flex gap-1.5 text-xs leading-5 text-cream/70">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                      <span>{choice.deliveryAddress}</span>
                    </p>
                  )}
              </div>
              <button
                onClick={clearChoice}
                className="ml-3 inline-flex shrink-0 items-center gap-1.5 text-sm text-gold transition hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 3xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)] 3xl:gap-12">
              {/* Récap */}
              <section
                aria-label="Récapitulatif"
                className="order-2 lg:order-1"
              >
                <h2 className="font-display text-xl font-semibold text-cream">
                  Récapitulatif
                </h2>
                <ul className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-ink-soft p-5">
                  {items.map((item) => (
                    <li
                      key={item.lineId}
                      className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-cream">{item.name}</p>
                        {item.options.length > 0 && (
                          <p className="text-xs text-muted">
                            {item.options.map((o) => o.label).join(", ")}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-xs italic text-muted">
                            « {item.note} »
                          </p>
                        )}
                        <p className="text-sm text-muted">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-display font-bold text-cream">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-cream">
                    Code promo
                  </summary>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={promo}
                      onChange={(e) => setPromo(e.target.value.toUpperCase())}
                      placeholder="Code promo"
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      className="shrink-0 rounded-xl border border-gold/40 px-4 text-sm font-semibold text-gold transition hover:bg-gold/10"
                    >
                      Appliquer
                    </button>
                  </div>
                  {promoMsg && (
                    <p
                      className={`mt-1 text-xs ${promoMsg.ok ? "text-green-400" : "text-red-400"}`}
                    >
                      {promoMsg.text}
                    </p>
                  )}
                </details>

                <div className="mt-4 space-y-2 rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm">
                  <div className="flex justify-between text-cream/80">
                    <span>Sous-total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Remise{promo ? ` (${promo})` : ""}</span>
                      <span>− {formatPrice(discount)}</span>
                    </div>
                  )}
                  {fee > 0 && (
                    <div className="flex justify-between text-cream/80">
                      <span>Livraison</span>
                      <span>{formatPrice(fee)}</span>
                    </div>
                  )}
                  {tip > 0 && (
                    <div className="flex justify-between text-cream/80">
                      <span>Pourboire</span>
                      <span>{formatPrice(tip)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/10 pt-2 font-display text-2xl font-bold text-gold">
                    <span className="text-base text-cream">Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  {/* Fidélité : 1 point par euro (cf. lib/loyalty.ts). */}
                  {Math.floor(total) > 0 && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-gold">
                      <Sparkles className="h-3.5 w-3.5" />
                      Vous gagnerez {Math.floor(total)} point
                      {Math.floor(total) > 1 ? "s" : ""} de fidélité
                    </p>
                  )}
                </div>

                <div className="mt-4 hidden rounded-2xl border border-white/10 bg-ink-soft p-5 sm:block">
                  <p className="text-sm font-semibold text-cream">
                    Commander par messagerie
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Le message reprend le panier, le créneau et le total estimé.
                    Vous confirmez ensuite vos coordonnées dans
                    l&apos;application.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <a
                      href={whatsappOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-200 transition hover:border-green-300 hover:bg-green-500/15"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                    <a
                      href={telegramOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:border-sky-300 hover:bg-sky-500/15"
                    >
                      <Send className="h-4 w-4" />
                      Telegram
                    </a>
                  </div>
                </div>
              </section>

              {/* Coordonnées */}
              <section
                aria-label="Vos coordonnées"
                className="order-1 lg:order-2"
              >
                <h2 className="font-display text-xl font-semibold text-cream">
                  Vos coordonnées
                </h2>
                <form action={action} className="mt-4 space-y-4">
                  {/* Honeypot anti-bot : masqué aux humains, rempli par les bots. */}
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                  />
                  <Field
                    id="name"
                    label="Nom"
                    error={errors.name}
                    onBlur={(v) => trackCheckoutLead("name", v)}
                  />
                  <Field
                    id="phone"
                    label="Téléphone"
                    type="tel"
                    error={errors.phone}
                    onBlur={(v) => trackCheckoutLead("phone", v)}
                  />
                  <Field
                    id="email"
                    label="Email de confirmation"
                    type="email"
                    error={errors.email}
                    onBlur={(v) => trackCheckoutLead("email", v)}
                  />
                  {choice.fulfillment === "livraison" &&
                    !choice.deliveryAddress && (
                      <Field
                        id="address"
                        label="Adresse complète de livraison"
                        error={errors.address}
                      />
                    )}
                  {globalError && (
                    <p role="alert" className="text-sm text-red-400">
                      {globalError}
                    </p>
                  )}
                  <div className="rounded-2xl bg-ink-soft/95 p-1 shadow-card backdrop-blur lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full disabled:opacity-60"
                    >
                      {submitting
                        ? "Validation…"
                        : `Valider — ${formatPrice(total)}`}
                    </button>
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                      <Lock className="h-3 w-3" />
                      Paiement sécurisé à l&apos;étape suivante.
                    </p>
                  </div>
                </form>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function EmptyCartState() {
  const siteConfig = useSiteConfig();
  return (
    <div className="mt-6 grid gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1.1fr)_0.9fr] 3xl:grid-cols-[minmax(0,1.25fr)_0.85fr] 3xl:gap-8">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-ink-soft">
        <div className="p-4 sm:border-b sm:border-white/10 sm:p-7">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold sm:h-14 sm:w-14 sm:rounded-2xl">
              <ShoppingBag className="h-5 w-5 sm:h-7 sm:w-7" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-cream sm:text-2xl">
                Votre panier est vide.
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted sm:mt-2">
                Ajoutez un produit depuis la carte pour choisir votre mode de
                service et finaliser la commande.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 sm:mt-6">
            <Link href="/menu" className="btn-primary w-full sm:w-auto">
              <UtensilsCrossed className="h-4 w-4" />
              Voir le menu
            </Link>
            <Link
              href="/menu"
              className="hidden min-h-[3rem] items-center justify-center gap-2 rounded-full border border-gold/45 bg-gold/10 px-5 py-2.5 text-sm font-bold text-gold transition hover:border-gold hover:bg-gold hover:text-ink sm:inline-flex"
            >
              <ShoppingBag className="h-4 w-4" />
              Commande simple
            </Link>
            <a
              href={siteConfig.socials.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-[#25D366]/18 hidden min-h-[3rem] items-center justify-center gap-2 rounded-full border border-[#25D366]/45 bg-[#25D366]/10 px-5 py-2.5 text-sm font-bold text-cream transition hover:border-[#25D366] sm:inline-flex"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Commander par WhatsApp
            </a>
          </div>
          <MobileQuickHelp />
        </div>

        <div className="hidden gap-3 p-4 sm:grid sm:grid-cols-3 sm:p-5 3xl:gap-5 3xl:p-6">
          {starterLinks.map((dish) => (
            <Link
              key={dish.href}
              href={dish.href}
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-gold/50"
            >
              <div className="relative aspect-[5/3]">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes="(max-width: 640px) 80vw, (max-width: 1920px) 220px, 300px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/85 to-transparent" />
              </div>
              <div className="p-3">
                <p className="font-display text-lg font-semibold text-cream 3xl:text-2xl">
                  {dish.name}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold 3xl:text-sm">
                  {dish.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <div className="hidden lg:block">
        <CheckoutHelpPanel />
      </div>
    </div>
  );
}

function MobileQuickHelp() {
  const siteConfig = useSiteConfig();
  const phoneHref = `tel:${siteConfig.contact.phone.replace(/\s/g, "")}`;

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:hidden">
      <p className="text-sm font-semibold text-cream">Besoin d’aide ?</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={phoneHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-bold text-cream transition hover:border-gold hover:text-gold"
        >
          <Phone className="h-4 w-4" />
          Appeler
        </a>
        <a
          href={siteConfig.socials.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#25D366]/35 bg-[#25D366]/10 text-sm font-bold text-cream transition hover:border-[#25D366]"
        >
          <MessageCircle className="h-4 w-4 text-[#25D366]" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}

function CheckoutHelpPanel({ subtotal }: { subtotal?: number }) {
  const siteConfig = useSiteConfig();
  const phoneHref = `tel:${siteConfig.contact.phone.replace(/\s/g, "")}`;
  const checkoutHighlights = buildCheckoutHighlights(siteConfig.contact.city);

  return (
    <aside className="rounded-2xl border border-gold/25 bg-gold/[0.06] p-5 shadow-[0_18px_50px_-42px_rgba(245,158,11,0.65)] lg:sticky lg:top-32">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold/50 bg-ink text-gold">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-cream">
            Commande accompagnée
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            L&apos;équipe reste joignable si vous voulez confirmer un horaire,
            une adresse ou une option.
          </p>
        </div>
      </div>

      {typeof subtotal === "number" && (
        <div className="mt-5 rounded-xl border border-white/10 bg-ink/55 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-cream/70">Panier actuel</span>
            <span className="font-display text-xl font-bold text-gold">
              {formatPrice(subtotal)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {checkoutHighlights.map(({ title, text, Icon }) => (
          <div key={title} className="flex gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink/75 text-gold">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-cream">{title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <a
          href={phoneHref}
          className="border-white/12 inline-flex items-center justify-center gap-2 rounded-xl border bg-ink px-4 py-3 text-sm font-bold text-cream transition hover:border-gold hover:text-gold"
        >
          <Phone className="h-4 w-4" />
          Appeler
        </a>
        <a
          href={siteConfig.socials.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366]/12 hover:bg-[#25D366]/18 inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 px-4 py-3 text-sm font-bold text-cream transition hover:border-[#25D366]"
        >
          <MessageCircle className="h-4 w-4 text-[#25D366]" />
          WhatsApp
        </a>
      </div>

      <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs leading-5 text-muted">
        <p className="flex gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
          {siteConfig.contact.address}
        </p>
        <p className="flex gap-2">
          <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-gold text-gold" />
          4.8/5 Google · produits frais · service rapide
        </p>
      </div>
    </aside>
  );
}

/** Indicateur d'étapes du checkout (1 = mode/créneau, 2 = coordonnées). */
function StepIndicator({ current }: { current: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Mode & créneau" },
    { n: 2, label: "Coordonnées & paiement" },
  ];
  return (
    <ol className="mt-6 flex items-center gap-3">
      {steps.map((s, i) => {
        const active = current === s.n;
        const done = current > s.n;
        return (
          <li key={s.n} className="flex flex-1 items-center gap-3">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                active
                  ? "bg-gold text-ink"
                  : done
                    ? "bg-gold/30 text-gold"
                    : "bg-white/10 text-cream/50"
              }`}
            >
              {s.n}
            </span>
            <span
              className={`text-xs font-medium sm:text-sm ${active ? "text-cream" : "text-cream/50"}`}
            >
              {s.label}
            </span>
            {i === 0 && (
              <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  id,
  label,
  type = "text",
  error,
  onBlur,
}: {
  id: string;
  label: string;
  type?: string;
  error?: string;
  onBlur?: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-cream/80">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        className={fieldClass}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
