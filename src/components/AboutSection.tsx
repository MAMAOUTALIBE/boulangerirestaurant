import Image from "next/image";
import { Check, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { aboutPoints } from "@/data/services";

const gallery = [
  {
    src: "/images/africain/thiep-poulet.webp",
    alt: "Thiéboudiène au poulet Lauuale Simbo",
  },
  {
    src: "/images/africain/yassa-poulet.webp",
    alt: "Poulet yassa maison",
  },
  {
    src: "/images/africain/desserts-africains.webp",
    alt: "Desserts africains maison",
  },
];

/** Bloc « À propos de nous » (colonne centrale de la bande). */
export function AboutSection() {
  return (
    <Reveal className="h-full">
      <div id="a-propos" className="flex h-full flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
          À propos de nous
        </p>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
          Une cuisine africaine généreuse, pensée pour le partage
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          {`Notre équipe prépare chaque jour les grands classiques d'Afrique de
          l'Ouest avec une exigence simple : des produits frais, des recettes
          généreuses et un accueil chaleureux, midi et soir.`}
        </p>

        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {aboutPoints.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-ink/85">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-600">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-sm font-medium">{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {gallery.map((g, index) => (
            <div
              key={g.src}
              className={`relative overflow-hidden rounded-xl ${
                index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"
              }`}
            >
              <Image
                src={g.src}
                alt={g.alt}
                fill
                sizes="(max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
          ))}
        </div>

        <a
          href="#contact"
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:bg-ink-soft"
        >
          Découvrir notre histoire
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </Reveal>
  );
}
