"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryItem =
  | { type: "image"; src: string; alt: string; tag: string }
  | { type: "video"; src: string; poster: string; alt: string; tag: string };

type Filter = "all" | "image" | "video";

/**
 * Médias de la galerie, désormais gérés depuis /admin/contenus (section
 * « galerie ») : ajouter une photo ou une vidéo ne demande plus de toucher au
 * code. L'onglet « Vidéos » n'apparaît que si la galerie en contient.
 */
export function GallerySection({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Tout" },
    { id: "image", label: "Photos" },
    ...(items.some((it) => it.type === "video")
      ? [{ id: "video" as const, label: "Vidéos" }]
      : []),
  ];
  const [active, setActive] = useState<number | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const visible = items.filter((it) => filter === "all" || it.type === filter);
  const current = active !== null ? (visible[active] ?? null) : null;

  // Active/désactive les flèches selon la position de défilement.
  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollByPage = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  // Recalcule les flèches au montage, au changement de filtre et au resize.
  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: 0 });
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [filter, updateArrows]);

  const close = useCallback(() => setActive(null), []);
  const go = useCallback(
    (dir: number) =>
      setActive((cur) => {
        if (cur === null) return cur;
        const n = visible.length;
        return n ? (cur + dir + n) % n : null;
      }),
    [visible.length],
  );

  // Verrou de défilement de l'arrière-plan + navigation clavier (lightbox).
  useEffect(() => {
    if (current === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [current, close, go]);

  return (
    <section className="container-page pb-16 pt-6 sm:pb-24 sm:pt-10">
      {/* En-tête */}
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
          <Camera className="h-4 w-4" /> Galerie
        </p>
        <h1 className="mt-2 font-display text-[1.9rem] font-bold leading-tight text-cream sm:text-4xl lg:text-5xl">
          Nos plats en images
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cream/65 sm:text-base">
          Thiéboudiène, yassa, mafé, attiéké, grillades et douceurs : un aperçu
          de ce que l&apos;on prépare chaque jour en cuisine.
        </p>
      </div>

      {/* Filtres (gauche) + flèches de défilement (droite) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 sm:mt-8">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActive(null);
                setFilter(f.id);
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                filter === f.id
                  ? "border-gold bg-gold text-ink"
                  : "border-white/15 text-cream/75 hover:border-gold/50 hover:text-cream",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              aria-label="Médias précédents"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-cream transition enabled:hover:border-gold enabled:hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!canNext}
              aria-label="Médias suivants"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-cream transition enabled:hover:border-gold enabled:hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Carrousel : 3 cartes par vue (desktop), défilement par flèches ou swipe */}
      {visible.length > 0 ? (
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="mt-6 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-8 [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Agrandir : ${item.alt}`}
              className="group relative aspect-[4/3] w-[80%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-ink-soft min-[480px]:w-[60%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
            >
              {/*
                Une vidéo sans affiche donnerait un `src` vide, ce qui fait
                échouer next/image et casserait la page : dans ce cas on garde
                simplement la tuile sombre avec son bouton de lecture.
              */}
              {(item.type === "video" ? item.poster : item.src) && (
                <Image
                  src={item.type === "video" ? item.poster : item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 1024px) 60vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              )}
              <span
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent"
                aria-hidden
              />
              {item.type === "video" && (
                <span
                  className="absolute inset-0 grid place-items-center"
                  aria-hidden
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-cream backdrop-blur transition group-hover:bg-gold group-hover:text-ink">
                    <Play className="h-5 w-5 translate-x-0.5" />
                  </span>
                </span>
              )}
              <span className="absolute inset-x-2 bottom-2 flex items-center gap-2">
                <span className="rounded-full bg-black/50 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-gold backdrop-blur">
                  {item.tag}
                </span>
                <span className="truncate text-left text-xs font-semibold text-cream/90">
                  {item.alt}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
          <p className="text-sm text-cream/60">
            {filter === "video"
              ? "Les vidéos arrivent très bientôt."
              : "Aucun média pour le moment."}
          </p>
        </div>
      )}

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu du média"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/40 text-cream transition hover:border-gold hover:text-gold sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" />
          </button>

          {visible.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Média précédent"
                className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-cream transition hover:border-gold hover:text-gold sm:left-4"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Média suivant"
                className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-cream transition hover:border-gold hover:text-gold sm:right-4"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            className="flex max-h-[86vh] w-full max-w-3xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {current.type === "video" ? (
              <video
                key={current.src}
                src={current.src}
                poster={current.poster}
                controls
                autoPlay
                playsInline
                className="max-h-[86vh] w-auto max-w-full rounded-2xl"
              />
            ) : (
              <div className="relative h-[78vh] w-full">
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="100vw"
                  className="rounded-2xl object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
