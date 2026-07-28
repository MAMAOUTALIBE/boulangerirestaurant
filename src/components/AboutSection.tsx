import Image from "next/image";
import { Check, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { getContentSections } from "@/lib/content";

/**
 * Bloc « À propos de nous » (colonne centrale de la bande).
 *
 * Textes, points forts et photos sont éditables depuis /admin/contenus
 * (sections « a-propos » et « a-propos-points »).
 */
export async function AboutSection() {
  const contenus = await getContentSections(["a-propos", "a-propos-points"]);
  const blocs = contenus["a-propos"] ?? [];
  const texte = blocs.find((b) => b.key === "texte") ?? blocs[0];
  const photos = blocs.filter((b) => b.mediaUrl);
  const points = (contenus["a-propos-points"] ?? [])
    .map((b) => b.title)
    .filter((titre): titre is string => Boolean(titre));

  return (
    <Reveal className="h-full">
      <div id="a-propos" className="flex h-full flex-col">
        {texte?.subtitle && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
            {texte.subtitle}
          </p>
        )}
        {texte?.title && (
          <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {texte.title}
          </h3>
        )}
        {texte?.body && (
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            {texte.body}
          </p>
        )}

        {points.length > 0 && (
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-ink/85">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-600">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm font-medium">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {photos.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.key}
                className={`relative overflow-hidden rounded-xl ${
                  index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"
                }`}
              >
                <Image
                  src={photo.mediaUrl as string}
                  alt={photo.alt ?? ""}
                  fill
                  sizes="(max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
            ))}
          </div>
        )}

        {texte?.href && texte.ctaLabel && (
          <a
            href={texte.href}
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:bg-ink-soft"
          >
            {texte.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </Reveal>
  );
}
