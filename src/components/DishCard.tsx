"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, SlidersHorizontal } from "lucide-react";
import type { Dish } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface DishCardProps {
  dish: Dish;
  /** Si fourni, le bouton mène à la fiche plat (plat avec options à choisir). */
  href?: string;
  /** Plat indisponible (épuisé). */
  unavailable?: boolean;
  /** Badges commerciaux affichés sur la photo. */
  badges?: string[];
  /** Infos courtes : options, sauces, allergènes. */
  details?: string[];
  /** Stock restant aujourd'hui : affiche « plus que X » si bas. null = illimité. */
  lowStock?: number | null;
  /** Charge l'image immédiatement pour les premières cartes visibles. */
  priority?: boolean;
}

/** Carte produit : image, titre, description, prix et action (ajout ou choix). */
export function DishCard({
  dish,
  href,
  unavailable,
  lowStock,
  badges = [],
  details = [],
  priority = false,
}: DishCardProps) {
  const { addItem } = useCart();
  const displayBadges = Array.from(
    new Set([dish.tag, ...badges].filter(Boolean)),
  );
  const actionButton = unavailable ? (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-cream/35 sm:h-10 sm:w-10 sm:border-ink/10 sm:text-ink/35">
      —
    </span>
  ) : href ? (
    <Link
      href={href}
      aria-label={`Choisir ${dish.name}`}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-ink shadow-[0_8px_22px_-14px_rgba(245,158,11,0.95)] transition hover:scale-105 hover:bg-gold-400 sm:h-12 sm:w-12 sm:bg-ink sm:text-gold sm:shadow-[0_8px_22px_-14px_rgba(8,8,8,0.95)] sm:hover:bg-forest"
    >
      <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
    </Link>
  ) : (
    <button
      onClick={() =>
        addItem({
          dishId: dish.id,
          name: dish.name,
          image: dish.image,
          basePrice: dish.price,
        })
      }
      aria-label={`Ajouter ${dish.name} au panier`}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-ink shadow-[0_8px_22px_-14px_rgba(245,158,11,0.95)] transition hover:scale-105 hover:bg-gold-400 active:scale-95 sm:h-12 sm:w-12 sm:bg-ink sm:text-gold sm:shadow-[0_8px_22px_-14px_rgba(8,8,8,0.95)] sm:hover:bg-forest"
    >
      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  );

  return (
    <motion.article
      whileHover={{ y: unavailable ? 0 : -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group grid h-full grid-cols-[7rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-gold/15 bg-[#101010] shadow-[0_18px_42px_-34px_rgba(245,158,11,0.78)] transition-shadow duration-300 hover:shadow-[0_22px_52px_-34px_rgba(8,8,8,0.72)] min-[390px]:grid-cols-[7.5rem_minmax(0,1fr)] sm:flex sm:flex-col sm:border-ink/10 sm:bg-white sm:shadow-[0_16px_40px_-30px_rgba(8,8,8,0.62)]"
    >
      <div className="relative h-full min-h-[7.25rem] w-full overflow-hidden bg-ink min-[390px]:min-h-[7.75rem] sm:aspect-[5/3] sm:min-h-0 3xl:aspect-[16/10]">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, (max-width: 1536px) 30vw, (max-width: 1920px) 23vw, (max-width: 2560px) 18vw, 15vw"
          priority={priority}
          className={`object-cover transition-transform duration-500 group-hover:scale-110 ${unavailable ? "grayscale" : ""}`}
        />
        {displayBadges.length > 0 && !unavailable && (
          <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5 sm:left-3 sm:top-3 3xl:left-4 3xl:top-4">
            {displayBadges.map((badge) => (
              <span
                key={badge}
                className="bg-cream/92 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-forest backdrop-blur sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-wider 3xl:px-3.5 3xl:text-xs"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
        {unavailable && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-red-300 backdrop-blur sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-wider">
            Épuisé
          </span>
        )}
        {!unavailable && lowStock != null && lowStock > 0 && lowStock <= 5 && (
          <span className="absolute right-2 top-2 rounded-full bg-gold/90 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-ink backdrop-blur sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-wider">
            Plus que {lowStock}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/80 to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-0.5 font-display text-lg font-bold text-cream backdrop-blur-[2px] sm:bottom-3 sm:left-3 sm:py-1 sm:text-2xl 3xl:bottom-4 3xl:left-4 3xl:text-3xl">
          {formatPrice(dish.price)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-3 py-2.5 sm:px-5 sm:pb-4 sm:pt-3.5 3xl:px-6 3xl:pb-5 3xl:pt-4">
        <h3 className="font-display text-lg font-semibold leading-tight text-cream sm:text-2xl sm:text-ink 3xl:text-3xl">
          {dish.name}
        </h3>
        <div className="mt-1 flex flex-1 items-start justify-between gap-2 sm:mt-1.5 sm:gap-3">
          <p className="line-clamp-2 text-[0.78rem] leading-4 text-cream/70 sm:text-base sm:leading-relaxed sm:text-ink/70 3xl:text-lg 3xl:leading-8">
            {dish.description}
          </p>
          {actionButton}
        </div>
        {details.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3">
            {details.slice(0, 4).map((detail) => (
              <span
                key={detail}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.66rem] font-semibold text-cream/60 sm:border-ink/10 sm:bg-ink/[0.04] sm:px-2.5 sm:py-1 sm:text-xs sm:text-ink/60"
              >
                {detail}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
