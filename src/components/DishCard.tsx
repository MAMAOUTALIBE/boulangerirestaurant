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
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/10 text-ink/35">
      —
    </span>
  ) : href ? (
    <Link
      href={href}
      aria-label={`Choisir ${dish.name}`}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-gold shadow-[0_8px_22px_-14px_rgba(8,8,8,0.95)] transition hover:scale-105 hover:bg-forest"
    >
      <SlidersHorizontal className="h-5 w-5" />
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
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-gold shadow-[0_8px_22px_-14px_rgba(8,8,8,0.95)] transition hover:scale-105 hover:bg-forest active:scale-95"
    >
      <Plus className="h-5 w-5" />
    </button>
  );

  return (
    <motion.article
      whileHover={{ y: unavailable ? 0 : -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_16px_40px_-30px_rgba(8,8,8,0.62)] transition-shadow duration-300 hover:shadow-[0_22px_52px_-34px_rgba(8,8,8,0.72)]"
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-ink 3xl:aspect-[16/10]">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, (max-width: 1536px) 30vw, (max-width: 1920px) 23vw, (max-width: 2560px) 18vw, 15vw"
          priority={priority}
          className={`object-cover transition-transform duration-500 group-hover:scale-110 ${unavailable ? "grayscale" : ""}`}
        />
        {displayBadges.length > 0 && !unavailable && (
          <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 3xl:left-4 3xl:top-4">
            {displayBadges.map((badge) => (
              <span
                key={badge}
                className="bg-cream/92 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-forest backdrop-blur 3xl:px-3.5 3xl:text-xs"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
        {unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-300 backdrop-blur">
            Épuisé
          </span>
        )}
        {!unavailable && lowStock != null && lowStock > 0 && lowStock <= 5 && (
          <span className="absolute right-3 top-3 rounded-full bg-gold/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink backdrop-blur">
            Plus que {lowStock}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/80 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-md bg-black/35 px-2 py-1 font-display text-2xl font-bold text-cream backdrop-blur-[2px] 3xl:bottom-4 3xl:left-4 3xl:text-3xl">
          {formatPrice(dish.price)}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-3.5 3xl:px-6 3xl:pb-5 3xl:pt-4">
        <h3 className="font-display text-2xl font-semibold leading-tight text-ink 3xl:text-3xl">
          {dish.name}
        </h3>
        <div className="mt-1.5 flex flex-1 items-start justify-between gap-3">
          <p className="line-clamp-2 text-base leading-relaxed text-ink/70 3xl:text-lg 3xl:leading-8">
            {dish.description}
          </p>
          {actionButton}
        </div>
        {details.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {details.slice(0, 4).map((detail) => (
              <span
                key={detail}
                className="text-ink/62 rounded-full border border-ink/10 bg-ink/[0.04] px-2.5 py-1 text-xs font-semibold"
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
