import type { Metadata } from "next";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SeasonalPreorderForm } from "@/components/SeasonalPreorderForm";
import { getActiveSeasonalProducts } from "@/lib/seasonal";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique de saison",
  description:
    "Précommandez nos spécialités de saison : galette des rois, bûches de Noël et pièces de fête. Quantités limitées, retrait en boutique.",
};

export default async function BoutiqueDeSaisonPage() {
  const products = await getActiveSeasonalProducts();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-ink pb-20 pt-28">
        <div className="container-page max-w-5xl">
          <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
            <Sparkles className="h-8 w-8 text-gold" />
            Boutique de saison
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Nos spécialités de saison en précommande, en quantités limitées.
            Réservez la vôtre, payez au retrait en boutique.
          </p>

          {products.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
              Aucune offre de saison en ce moment. Revenez bientôt pour la
              galette des rois et les bûches de fin d&apos;année !
            </p>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-ink-soft"
                >
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-gold backdrop-blur">
                      {formatPrice(p.price)}
                    </span>
                    {p.soldOut ? (
                      <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-red-300 backdrop-blur">
                        Complet
                      </span>
                    ) : (
                      p.remaining <= 10 && (
                        <span className="absolute right-3 top-3 rounded-full bg-gold/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
                          Plus que {p.remaining}
                        </span>
                      )
                    )}
                  </div>
                  <div className="p-5 sm:p-6">
                    <h2 className="font-display text-2xl font-bold text-cream">
                      {p.name}
                    </h2>
                    <p className="mt-1.5 text-sm text-cream/75">
                      {p.description}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Précommandes jusqu&apos;au {p.salesEndLabel} · retrait du{" "}
                      {p.pickupStart} au {p.pickupEnd}
                    </p>
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <SeasonalPreorderForm
                        slug={p.slug}
                        remaining={p.remaining}
                        pickupStart={p.pickupStart}
                        pickupEnd={p.pickupEnd}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
