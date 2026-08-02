"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/context/SiteConfigContext";

interface LogoProps {
  className?: string;
  /** Variante claire pour fonds sombres (défaut) ou sombre. */
  tone?: "light" | "dark";
  /** Sous-titre optionnel, utilisé par le header mobile compact. */
  subtitle?: string;
}

/** Logo du restaurant. */
export function Logo({ className, tone = "light", subtitle }: LogoProps) {
  const siteConfig = useSiteConfig();
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3.5", className)}
      aria-label={`${siteConfig.name} — Accueil`}
    >
      <span
        className={cn(
          "relative h-11 w-11 overflow-hidden rounded-2xl border shadow-[0_18px_42px_-30px_rgba(216,154,28,0.95)] transition group-hover:border-gold sm:h-12 sm:w-12 3xl:h-14 3xl:w-14",
          tone === "light"
            ? "border-gold/45 bg-cream"
            : "border-gold/60 bg-white",
        )}
      >
        {/*
          `object-contain` et non `object-cover` : le logo vient du CRM et peut
          avoir n'importe quel rapport hauteur/largeur. Un logo panoramique
          serait rogné en carré par `cover` — ici il est réduit pour tenir
          entier dans la pastille, quelle que soit sa forme.
        */}
        <Image
          src={siteConfig.branding.logoUrl}
          alt=""
          fill
          sizes="56px"
          className="object-contain p-0.5"
          priority
        />
      </span>
      <span className="min-w-0 leading-none">
        <span
          className={cn(
            "block font-display text-xl font-bold tracking-tight sm:text-2xl 3xl:text-3xl",
            tone === "light" ? "text-cream" : "text-ink",
          )}
        >
          {siteConfig.name}
        </span>
        {subtitle ? (
          <span
            className={cn(
              "mt-1 block truncate text-[0.68rem] font-medium leading-tight sm:hidden",
              tone === "light" ? "text-cream/65" : "text-ink/65",
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
