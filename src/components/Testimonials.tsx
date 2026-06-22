import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { testimonials } from "@/data/testimonials";
import { cn } from "@/lib/utils";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Note : ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-gold text-gold" : "text-white/20",
          )}
        />
      ))}
    </div>
  );
}

/** Section « Ils parlent de nous » : avis clients. */
export function Testimonials() {
  return (
    <section id="avis" className="section bg-ink">
      <div className="container-page">
        <Reveal>
          <h2 className="font-display text-3xl font-bold text-cream sm:text-4xl">
            Ils parlent de <span className="text-gold">nous</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={0.08 * i}>
              <figure className="relative h-full rounded-2xl border border-white/10 bg-ink-soft p-6 shadow-card">
                <Quote className="absolute right-5 top-5 h-8 w-8 text-gold/20" />
                <div className="flex items-center gap-3">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/30"
                  />
                  <div>
                    <figcaption className="font-semibold text-cream">
                      {t.name}
                    </figcaption>
                    <Stars rating={t.rating} />
                  </div>
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-cream/80">
                  &ldquo;{t.comment}&rdquo;
                </blockquote>
                {t.city && (
                  <p className="mt-3 text-xs uppercase tracking-wider text-muted">
                    {t.city}
                  </p>
                )}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
