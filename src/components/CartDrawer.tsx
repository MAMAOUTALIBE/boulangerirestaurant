"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useSiteConfig } from "@/context/SiteConfigContext";

interface Suggestion {
  dishId: string;
  name: string;
  image: string;
  basePrice: number;
}

/** Tiroir latéral affichant le contenu du panier. */
export function CartDrawer() {
  const siteConfig = useSiteConfig();
  const {
    items,
    open,
    setOpen,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    totalPrice,
  } = useCart();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Charge les suggestions de desserts et boissons à la première ouverture.
  useEffect(() => {
    if (!open || suggestions.length > 0) return;
    fetch("/api/suggestions")
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions ?? []))
      .catch(() => {});
  }, [open, suggestions.length]);

  // Suggestions encore absentes du panier (max 3).
  const crossSell = suggestions
    .filter((s) => !items.some((i) => i.dishId === s.dishId))
    .slice(0, 3);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-[90%] max-w-md flex-col bg-ink-soft shadow-card"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Panier"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-cream">
                <ShoppingBag className="h-5 w-5 text-gold" />
                Votre panier
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer le panier"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-cream transition hover:border-gold/60 hover:text-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-muted" />
                <p className="text-muted">Votre panier est vide.</p>
                <button
                  onClick={() => setOpen(false)}
                  className="btn-primary mt-2"
                >
                  Découvrir nos produits
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-white/10 overflow-y-auto p-5">
                  {items.map((item) => (
                    <li
                      key={item.lineId}
                      className="flex gap-4 py-4 first:pt-0"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-cream">
                            {item.name}
                          </h3>
                          <button
                            onClick={() => removeItem(item.lineId)}
                            aria-label={`Retirer ${item.name} du panier`}
                            className="-mr-2 -mt-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white/5 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
                        <span className="text-sm text-gold">
                          {formatPrice(item.unitPrice)}
                        </span>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.lineId, item.quantity - 1)
                              }
                              aria-label={`Diminuer la quantité de ${item.name}`}
                              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-cream transition hover:border-gold/60 hover:text-gold"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold text-cream">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.lineId, item.quantity + 1)
                              }
                              aria-label={`Augmenter la quantité de ${item.name}`}
                              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-cream transition hover:border-gold/60 hover:text-gold"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="font-display font-bold text-cream">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {crossSell.length > 0 && (
                  <div className="border-t border-white/10 px-5 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      Vous oubliez quelque chose ?
                    </p>
                    <ul className="space-y-2">
                      {crossSell.map((s) => (
                        <li
                          key={s.dishId}
                          className="flex items-center gap-3 rounded-xl border border-white/10 p-2"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={s.image}
                              alt={s.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-cream">
                              {s.name}
                            </p>
                            <p className="text-xs text-gold">
                              {formatPrice(s.basePrice)}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              addItem({
                                dishId: s.dishId,
                                name: s.name,
                                image: s.image,
                                basePrice: s.basePrice,
                              })
                            }
                            aria-label={`Ajouter ${s.name} au panier`}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-ink transition hover:bg-gold-400 active:scale-95"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-white/10 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-muted">Total</span>
                    <span className="font-display text-2xl font-bold text-gold">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  {/* Fidélité : 1 point par euro (cf. lib/loyalty.ts). */}
                  {siteConfig.orderingMode !== "vitrine" &&
                    Math.floor(totalPrice) > 0 && (
                      <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-2 text-xs font-medium text-gold">
                        <Sparkles className="h-3.5 w-3.5" />
                        Vous gagnerez {Math.floor(totalPrice)} point
                        {Math.floor(totalPrice) > 1 ? "s" : ""} de fidélité
                      </p>
                    )}
                  {siteConfig.orderingMode !== "vitrine" ? (
                    <>
                      <a
                        href="/commander"
                        onClick={() => setOpen(false)}
                        className="btn-primary w-full"
                      >
                        Passer la commande
                      </a>
                      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
                        <Lock className="h-3 w-3" />{" "}
                        {siteConfig.orderingMode === "paiement_en_ligne"
                          ? "Paiement 100 % sécurisé"
                          : "Paiement directement au restaurant"}
                      </p>
                    </>
                  ) : (
                    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-center">
                      <p className="font-semibold text-cream">
                        Commande en ligne bientôt disponible
                      </p>
                      <p className="mt-2 text-sm leading-5 text-cream/70">
                        Préparez votre sélection, puis venez commander et payer
                        au restaurant, sur place ou à emporter.
                      </p>
                      <div className="mt-4 grid gap-2">
                        <Link
                          href="/#contact"
                          onClick={() => setOpen(false)}
                          className="btn-primary w-full"
                        >
                          Voir l’adresse et les horaires
                        </Link>
                        <Link
                          href="/menu"
                          onClick={() => setOpen(false)}
                          className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-cream transition hover:border-gold/50"
                        >
                          Continuer à découvrir le menu
                        </Link>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={clear}
                    className="mt-2 w-full text-center text-sm text-muted transition hover:text-cream"
                  >
                    Vider le panier
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
