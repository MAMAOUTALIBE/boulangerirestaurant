"use client";

import { useEffect, useId, useState } from "react";
import { Mail, MessageCircle, Star, X } from "lucide-react";
import {
  PremiumContactForm,
  PremiumReviewForm,
} from "@/components/PremiumEngagementForms";

type ActiveSheet = "review" | "contact" | null;

function MobileStars() {
  return (
    <div
      className="flex items-center justify-center gap-1"
      aria-label="Note 5 sur 5"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className="h-5 w-5 fill-gold text-gold" />
      ))}
    </div>
  );
}

function GoogleBadge() {
  return (
    <span
      aria-hidden
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xl font-bold shadow-[0_12px_28px_-20px_rgba(255,255,255,0.9)]"
    >
      <span className="bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
        G
      </span>
    </span>
  );
}

export function MobileTestimonialsCompact() {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const titleId = useId();

  useEffect(() => {
    if (!activeSheet) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveSheet(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeSheet]);

  const sheetTitle =
    activeSheet === "review" ? "Laisser un avis" : "Nous contacter";

  return (
    <>
      <div className="sm:hidden">
        <div className="rounded-[1.75rem] border border-gold/25 bg-[radial-gradient(circle_at_top,rgba(216,154,28,0.16),rgba(8,8,8,0)_38%),linear-gradient(145deg,#10100f,#070707)] px-4 py-5 shadow-[0_24px_70px_-54px_rgba(216,154,28,0.75)]">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-gold/45 text-gold">
            <MessageCircle className="h-5 w-5" />
          </div>

          <h2 className="mt-3 text-center font-display text-2xl font-bold uppercase tracking-[0.08em] text-cream">
            Ils parlent de <span className="text-gold">nous</span>
          </h2>

          <div className="mx-auto mt-4 h-px w-full max-w-[18rem] bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

          <div className="mt-4 text-center">
            <MobileStars />
            <p className="mt-2 text-base font-semibold text-cream">
              4,8/5 sur Google
            </p>
            <p className="mt-1 text-xs font-medium text-cream/60">
              Basé sur +230 avis clients
            </p>
          </div>

          <div className="mt-4 border-y border-white/[0.08] py-4">
            <div className="flex items-start gap-3">
              <GoogleBadge />
              <div className="min-w-0">
                <blockquote className="text-sm font-medium leading-6 text-cream/90">
                  <span className="text-gold">&ldquo;</span>
                  Les croissants sont feuilletés comme il faut, et le pain reste
                  excellent même le soir.
                  <span className="text-gold">&rdquo;</span>
                </blockquote>
                <p className="mt-2 text-sm font-semibold text-cream/75">
                  — Marie L.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveSheet("review")}
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-gold/70 px-2 text-[0.8rem] font-bold text-gold transition active:scale-[0.98] min-[380px]:text-[0.82rem]"
            >
              <Star className="hidden h-4 w-4 shrink-0 min-[380px]:block" />
              <span className="whitespace-nowrap">Laisser un avis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSheet("contact")}
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-gold px-2 text-[0.8rem] font-bold text-ink shadow-[0_18px_36px_-28px_rgba(216,154,28,0.95)] transition active:scale-[0.98] min-[380px]:text-[0.82rem]"
            >
              <Mail className="hidden h-4 w-4 shrink-0 min-[380px]:block" />
              <span className="whitespace-nowrap">Nous contacter</span>
            </button>
          </div>
        </div>
      </div>

      {activeSheet && (
        <div
          className="fixed inset-0 z-[110] sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setActiveSheet(null)}
            className="absolute inset-0 h-full w-full bg-black/75 backdrop-blur-sm"
          />
          <div className="absolute inset-x-3 bottom-3 max-h-[84dvh] overflow-y-auto rounded-[1.6rem] border border-gold/25 bg-[#0B0B0B] p-4 text-cream shadow-[0_24px_80px_-38px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id={titleId} className="text-lg font-bold">
                {sheetTitle}
              </h3>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setActiveSheet(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-cream transition active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {activeSheet === "review" ? (
              <PremiumReviewForm idPrefix="mobile-review" />
            ) : (
              <PremiumContactForm idPrefix="mobile-contact" />
            )}
          </div>
        </div>
      )}
    </>
  );
}
