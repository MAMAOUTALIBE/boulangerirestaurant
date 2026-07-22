"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/context/SiteConfigContext";

interface LogoProps {
  className?: string;
  /** Variante claire pour fonds sombres (défaut) ou sombre. */
  tone?: "light" | "dark";
}

/** Logo du restaurant. */
export function Logo({ className, tone = "light" }: LogoProps) {
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
        <Image
          src="/images/chez-mine/logo.jpg"
          alt=""
          fill
          sizes="56px"
          className="object-cover"
          priority
        />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-xl font-bold tracking-tight sm:text-2xl 3xl:text-3xl",
            tone === "light" ? "text-cream" : "text-ink",
          )}
        >
          {siteConfig.name}
        </span>
      </span>
    </Link>
  );
}
