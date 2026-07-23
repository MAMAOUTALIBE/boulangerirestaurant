"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, SlidersHorizontal, Wheat } from "lucide-react";
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
      className="group grid h-[8.7rem] grid-cols-[9.25rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-gold/40 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_46%),#101010] shadow-[0_16px_38px_-20px_rgba(245,158,11,0.72),0_8px_24px_-18px_rgba(0,0,0,0.95)] ring-1 ring-inset ring-white/[0.06] transition duration-300 hover:border-gold/75 hover:shadow-[0_20px_48px_-18px_rgba(245,158,11,0.88),0_10px_28px_-18px_rgba(0,0,0,0.98)] min-[390px]:h-[9rem] min-[390px]:grid-cols-[9.9rem_minmax(0,1fr)] sm:flex sm:h-full sm:flex-col sm:border-ink/10 sm:bg-white sm:shadow-[0_16px_40px_-30px_rgba(8,8,8,0.62)] sm:ring-0 sm:hover:border-gold/55 sm:hover:shadow-[0_20px_46px_-28px_rgba(216,154,28,0.72)]"
    >
      <div className="relative h-full min-h-0 w-full overflow-hidden bg-ink sm:aspect-[5/3] sm:min-h-0 3xl:aspect-[16/10]">
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
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-start px-3 pb-2.5 pt-3 sm:px-5 sm:pb-4 sm:pt-3.5 3xl:px-6 3xl:pb-5 3xl:pt-4">
        <h3 className="line-clamp-2 font-display text-[1.12rem] font-semibold leading-[1.08] text-cream min-[390px]:text-[1.18rem] sm:text-2xl sm:text-ink 3xl:text-3xl">
          {dish.name}
        </h3>
        <TitleUnderline />
        <p className="mt-1 line-clamp-1 text-[0.72rem] leading-[1.25] text-cream/70 min-[390px]:line-clamp-2 min-[390px]:text-[0.76rem] sm:mt-1.5 sm:text-base sm:leading-relaxed sm:text-ink/70 3xl:text-lg 3xl:leading-8">
          {dish.description}
        </p>
        {details.length > 0 && (
          <div className="mt-2 hidden flex-wrap gap-1.5 sm:mt-3 sm:flex">
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
        <div className="mt-auto flex items-end justify-between gap-3 pt-1.5 sm:pt-3">
          <span className="font-display text-[1.15rem] font-bold leading-none text-gold min-[390px]:text-xl sm:text-2xl sm:text-forest 3xl:text-3xl">
            {formatPrice(dish.price)}
          </span>
          {actionButton}
        </div>
      </div>
    </motion.article>
  );
}

function TitleUnderline() {
  return (
    <div
      aria-hidden="true"
      className="mt-1 flex w-[5.7rem] items-center gap-1.5 text-gold/90 sm:hidden"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-gold/0 via-gold/45 to-gold/80" />
      <Wheat className="h-3 w-3 rotate-90" strokeWidth={2.3} />
      <span className="h-px flex-1 bg-gradient-to-r from-gold/80 via-gold/45 to-gold/0" />
    </div>
  );
}
