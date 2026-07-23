import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MessageCircle, Quote, Send, Star } from "lucide-react";
import { MobileTestimonialsCompact } from "@/components/MobileTestimonialsCompact";
import { testimonials } from "@/data/testimonials";
import { getApprovedReviews } from "@/lib/reviews";

function Stars({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div className="flex gap-1" aria-label="Note 5 sur 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size === "md" ? "h-6 w-6" : "h-4 w-4"} fill-gold text-gold`}
        />
      ))}
    </div>
  );
}

function GoogleMark() {
  return (
    <span
      aria-hidden
      className="grid h-11 w-11 place-items-center rounded-full bg-white text-3xl font-bold"
    >
      <span className="bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
        G
      </span>
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-gold/20 bg-cream shadow-[0_24px_60px_-42px_rgba(0,0,0,0.75)] ${className}`}
    >
      {children}
    </div>
  );
}

export async function PremiumEngagementSection() {
  // Avis affichés : les avis approuvés depuis /admin/avis sont prioritaires ;
  // repli sur les avis curatés tant qu'aucun avis n'a encore été modéré.
  const { reviews: dbReviews } = await getApprovedReviews();
  const displayReviews: {
    id: string;
    name: string;
    comment: string;
    rating: number;
    avatar?: string;
    city?: string;
  }[] =
    dbReviews.length > 0
      ? dbReviews.slice(0, 2).map((r) => ({
          id: r.id,
          name: r.name,
          comment: r.comment,
          rating: r.rating,
        }))
      : testimonials.slice(0, 2).map((t) => ({
          id: t.id,
          name: t.name,
          comment: t.comment,
          rating: t.rating,
          avatar: t.avatar,
          city: t.city,
        }));

  return (
    <section
      id="avis-clients"
      className="scroll-mt-24 bg-[#050505] px-4 py-4 text-cream sm:px-6 sm:py-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1600px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_top,rgba(216,154,28,0.11),transparent_42%),#080808] shadow-[0_30px_80px_-60px_rgba(216,154,28,0.72)]">
        <div className="px-4 pb-5 pt-4 sm:px-8 lg:px-8">
          <MobileTestimonialsCompact />

          <div className="hidden sm:block">
            <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-stretch">
              <div className="flex flex-col justify-between rounded-3xl border border-gold/25 bg-cream p-5 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.75)]">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/45 text-gold">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
                        Avis clients
                      </p>
                      <h2 className="font-display text-3xl font-bold leading-tight text-ink">
                        Ils parlent de <span className="text-gold">nous</span>
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <GoogleMark />
                    <div>
                      <Stars size="md" />
                      <p className="mt-1 text-lg font-bold text-ink">
                        4,8/5 sur Google
                      </p>
                      <p className="text-sm text-ink/60">
                        Basé sur +230 avis clients
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <a
                    href="https://www.google.com/search?q=Lauuale+Simbo+avis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-gold/70 px-4 text-sm font-bold text-gold transition hover:bg-gold hover:text-ink"
                  >
                    Voir les avis
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gold px-4 text-sm font-bold text-ink shadow-[0_18px_36px_-28px_rgba(216,154,28,0.95)] transition hover:bg-gold-400"
                  >
                    Nous contacter
                    <Send className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {displayReviews.map((item) => (
                  <Card key={item.id} className="relative p-4">
                    <Quote className="absolute right-4 top-4 h-6 w-6 text-gold" />
                    <div className="flex gap-3 pr-8">
                      {item.avatar ? (
                        <Image
                          src={item.avatar}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-gold/50"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/15 text-base font-bold text-gold ring-2 ring-gold/50"
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-bold text-ink">{item.name}</p>
                          <div
                            className="flex"
                            aria-label={`Note ${item.rating} sur 5`}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={`h-3.5 w-3.5 ${n <= item.rating ? "fill-gold text-gold" : "text-ink/20"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <blockquote className="mt-2 text-sm leading-6 text-ink/80">
                          &ldquo;{item.comment}&rdquo;
                        </blockquote>
                        {item.city && (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                            {item.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
