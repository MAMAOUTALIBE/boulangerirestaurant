import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Variante claire pour fonds sombres (défaut) ou sombre. */
  tone?: "light" | "dark";
}

/** Logo Anatolia Grill. */
export function Logo({ className, tone = "light" }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3.5", className)}
      aria-label="Anatolia Grill — Accueil"
    >
      <span
        className={cn(
          "grid h-11 w-11 place-items-center rounded-2xl border shadow-[0_18px_42px_-30px_rgba(216,154,28,0.95)] transition group-hover:border-gold sm:h-12 sm:w-12 3xl:h-14 3xl:w-14",
          tone === "light"
            ? "border-gold/45 bg-[#0D0D0D]/70 text-gold"
            : "border-gold/60 bg-white text-gold-600",
        )}
      >
        <Flame className="h-8 w-8 sm:h-9 sm:w-9 3xl:h-10 3xl:w-10" />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-xl font-bold tracking-tight sm:text-2xl 3xl:text-3xl",
            tone === "light" ? "text-cream" : "text-ink",
          )}
        >
          Anatolia Grill
        </span>
      </span>
    </Link>
  );
}
