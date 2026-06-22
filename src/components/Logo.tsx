import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Variante claire pour fonds sombres (défaut) ou sombre. */
  tone?: "light" | "dark";
}

/** Logo boulangerie : miche stylisée + wordmark. */
export function Logo({ className, tone = "light" }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3.5", className)}
      aria-label="Boulangerie Artisanale — Accueil"
    >
      <span
        className={cn(
          "grid h-11 w-11 place-items-center rounded-2xl border shadow-[0_18px_42px_-30px_rgba(216,154,28,0.95)] transition group-hover:border-gold sm:h-12 sm:w-12 3xl:h-14 3xl:w-14",
          tone === "light"
            ? "border-gold/45 bg-[#0D0D0D]/70 text-gold"
            : "border-gold/60 bg-white text-gold-600",
        )}
      >
        <svg
          viewBox="0 0 48 48"
          className="h-8 w-8 sm:h-9 sm:w-9 3xl:h-10 3xl:w-10"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 29c0-8 6-15 14-15s14 7 14 15c0 7-5.7 12-14 12S10 36 10 29Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M17 29c0-4 3-8 7-10M24 19c4 2 7 6 7 10M14 31h20"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M18 10c1.5-3 3.5-4 6-4s4.5 1 6 4"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-xl font-bold tracking-tight sm:text-2xl 3xl:text-3xl",
            tone === "light" ? "text-cream" : "text-ink",
          )}
        >
          Boulangerie
        </span>
      </span>
    </Link>
  );
}
