import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

/** Carte sombre « Offre spéciale » avec code promo. */
export function PromoSection() {
  return (
    <Reveal className="h-full">
      <div className="relative h-full overflow-hidden rounded-xl border border-ink/10 bg-ink p-7 shadow-card sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gold" aria-hidden />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cream/60">
            Offre spéciale
          </p>
          <p className="mt-5 font-display text-7xl font-extrabold leading-none text-gold">
            -10%
          </p>
          <p className="mt-4 max-w-xs text-lg font-medium leading-snug text-cream">
            sur votre première commande en ligne
          </p>

          <div className="mt-6">
            <span className="text-xs uppercase tracking-widest text-muted">
              Code promo
            </span>
            <div className="mt-2 flex items-center justify-center rounded-xl border border-dashed border-gold/50 bg-gold/10 px-4 py-3">
              <span className="font-display text-2xl font-bold tracking-[0.22em] text-gold">
                BOULANGERIE10
              </span>
            </div>
          </div>

          <a href="/commander" className="btn-primary mt-6 w-full">
            Commander maintenant
            <ArrowRight className="h-4 w-4" />
          </a>

          <p className="mt-4 text-center text-xs text-muted">
            Valable jusqu&apos;au 30/06/2026
          </p>
        </div>
      </div>
    </Reveal>
  );
}
