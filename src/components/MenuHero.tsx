"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";

const slides = [
  {
    src: "/images/galerie/assiette-mixte.webp",
    alt: "Assiette mixte de döner et de viande grillée",
  },
  {
    src: "/images/galerie/assiette-doner.webp",
    alt: "Assiette de döner avec riz, frites et salade",
  },
  {
    src: "/images/galerie/lahmacun-maison.webp",
    alt: "Lahmacun fraîchement préparés",
  },
  {
    src: "/images/galerie/buffet-chaud.webp",
    alt: "Buffet chaud de spécialités turques",
  },
] as const;

const SLIDE_INTERVAL_MS = 5200;

/** Hero illustré de la carte, avec défilement doux et contrôles accessibles. */
export function MenuHero() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative flex min-h-[17rem] items-end overflow-hidden pb-7 pt-[6.5rem] sm:min-h-[23rem] sm:pb-12 sm:pt-32">
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className={`object-cover object-center transition-opacity duration-1000 ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/30" />
      </div>

      <div className="container-page relative z-10 flex w-full items-end justify-between gap-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
            Notre carte
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#F8F3EA] drop-shadow-lg sm:mt-3 sm:text-6xl">
            Le Menu
          </h1>
          <p className="mt-3 hidden max-w-xl text-base leading-relaxed text-white/80 drop-shadow sm:block">
            Grillades au charbon, kebabs, pide, lahmacun, mezze et desserts
            turcs, préparés chaque jour avec des produits frais.
          </p>
        </Reveal>

        <div
          className="mb-1 hidden items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-2 backdrop-blur sm:flex"
          aria-label="Choisir l’image du menu"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Afficher l’image ${index + 1} : ${slide.alt}`}
              aria-current={index === activeSlide ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                index === activeSlide
                  ? "w-8 bg-gold"
                  : "w-2.5 bg-white/55 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
