"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { Clock, PackageCheck, ShoppingBag, X } from "lucide-react";
import { AntiWasteReserveForm } from "@/components/AntiWasteReserveForm";
import { formatPrice } from "@/lib/utils";

interface MobileAntiWasteOfferView {
  title: string;
  description: string;
  price: number;
  pickupStart: string;
  pickupEnd: string;
  remaining: number;
  soldOut: boolean;
}

export function AntiWasteMobileOffer({
  offer,
}: {
  offer: MobileAntiWasteOfferView;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <article className="mt-3 overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_42%),#111111] shadow-[0_22px_60px_-50px_rgba(245,158,11,0.75)]">
        <div className="grid grid-cols-[7.5rem_1fr] gap-3 p-2.5">
          <div className="relative min-h-[8.25rem] overflow-hidden rounded-xl">
            <Image
              src="/images/africain/thiep-poulet.webp"
              alt="Plateau de grillades et spécialités du jour"
              fill
              sizes="120px"
              className="object-cover"
            />
            <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-1 text-[0.65rem] font-bold text-gold backdrop-blur">
              {formatPrice(offer.price)}
            </span>
          </div>
          <div className="min-w-0 py-1 pr-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-lg font-bold leading-tight text-cream">
                {offer.title}
              </h2>
              <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            </div>
            <p className="mt-1 line-clamp-2 text-[0.78rem] leading-4 text-cream/70">
              {offer.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-white/10 px-2 py-1 text-[0.66rem] font-semibold text-cream/70">
                {offer.pickupStart}-{offer.pickupEnd}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[0.66rem] font-bold ${
                  offer.soldOut
                    ? "bg-red-500/15 text-red-200"
                    : "bg-gold/90 text-ink"
                }`}
              >
                {offer.soldOut ? "Complet" : `${offer.remaining} dispo`}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={offer.soldOut}
          aria-haspopup="dialog"
          aria-controls="antiwaste-reserve-sheet"
          className="group flex min-h-14 w-full items-center justify-between gap-3 border-t border-white/10 px-3 text-left text-base font-bold text-gold transition hover:bg-gold/[0.06] active:bg-gold/[0.1] disabled:cursor-not-allowed disabled:text-muted"
        >
          <span className="inline-flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {offer.soldOut ? "Complet" : "Réserver"}
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 transition group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
            <span className="text-xl leading-none">›</span>
          </span>
        </button>
      </article>

      {open && (
        <div className="fixed inset-0 z-[90] sm:hidden" role="presentation">
          <button
            type="button"
            aria-label="Fermer la réservation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-[2px]"
          />
          <section
            id="antiwaste-reserve-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[1.65rem] border border-gold/25 bg-[#080808] px-4 pb-[calc(env(safe-area-inset-bottom)+4.25rem)] pt-4 shadow-[0_-24px_80px_-46px_rgba(245,158,11,0.8)]"
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-gold">
                  Réservation anti-gaspi
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-2xl font-bold leading-tight text-cream"
                >
                  {offer.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-cream transition hover:border-gold hover:text-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p
              id={descriptionId}
              className="mt-2 text-sm leading-5 text-cream/70"
            >
              Le contenu varie selon les invendus du jour. Retrait ce soir,
              paiement sur place.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <InfoPill label="Prix" value={formatPrice(offer.price)} />
              <InfoPill
                label="Retrait"
                value={`${offer.pickupStart}-${offer.pickupEnd}`}
              />
              <InfoPill label="Stock" value={`${offer.remaining} dispo`} />
            </div>

            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted">
              <Clock className="h-3.5 w-3.5 text-gold" />
              Réponse immédiate après validation.
            </p>

            <div className="mt-3">
              <AntiWasteReserveForm remaining={offer.remaining} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-center">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[0.72rem] font-bold text-cream">{value}</p>
    </div>
  );
}
