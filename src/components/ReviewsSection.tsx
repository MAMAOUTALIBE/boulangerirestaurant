import { Star } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewForm } from "@/components/ReviewForm";
import { getApprovedReviews } from "@/lib/reviews";
import { getSiteConfig } from "@/lib/site-settings";
import { serializeJsonLd } from "@/lib/utils";

/** Section avis : note moyenne, avis approuvés et formulaire de dépôt. */
export async function ReviewsSection() {
  const siteConfig = await getSiteConfig();
  const { reviews, count, average } = await getApprovedReviews();

  return (
    <section id="avis-clients" className="section bg-ink">
      {/* SEO : note agrégée */}
      {count > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              name: siteConfig.name,
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: average.toFixed(1),
                reviewCount: count,
              },
            }),
          }}
        />
      )}
      <div className="container-page grid gap-10 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">
              Avis clients
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-cream sm:text-4xl">
              Ils parlent de nous
            </h2>
            {count > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-5 w-5 ${n <= Math.round(average) ? "fill-gold text-gold" : "text-white/20"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-cream/80">
                  {average.toFixed(1)} / 5 · {count} avis
                </span>
              </div>
            )}
          </Reveal>

          <div className="mt-6 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-muted">Soyez le premier à laisser un avis !</p>
            ) : (
              reviews.map((r) => (
                <Reveal key={r.id}>
                  <figure className="rounded-2xl border border-white/10 bg-ink-soft p-5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-4 w-4 ${n <= r.rating ? "fill-gold text-gold" : "text-white/20"}`}
                        />
                      ))}
                    </div>
                    <blockquote className="mt-2 text-sm text-cream/85">
                      « {r.comment} »
                    </blockquote>
                    <figcaption className="mt-2 text-xs text-muted">
                      — {r.name}
                    </figcaption>
                  </figure>
                </Reveal>
              ))
            )}
          </div>
        </div>

        <Reveal>
          <div className="rounded-2xl border border-white/10 bg-ink-soft p-6 lg:sticky lg:top-28">
            <h3 className="font-display text-xl font-semibold text-cream">
              Laisser un avis
            </h3>
            <p className="mt-1 text-sm text-muted">
              Votre retour aide les autres gourmands (publié après validation).
            </p>
            <div className="mt-4">
              <ReviewForm />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
