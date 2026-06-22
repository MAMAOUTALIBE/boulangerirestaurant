import type { Metadata } from "next";
import { Recycle, Leaf } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AntiWasteReserveForm } from "@/components/AntiWasteReserveForm";
import { getTodayAntiWasteOffer } from "@/lib/antiwaste";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panier anti-gaspi",
  description:
    "Réservez un panier surprise anti-gaspillage à prix réduit, à retirer en fin de journée. Quantités limitées, contre le gaspillage alimentaire.",
};

export default async function AntiGaspiPage() {
  const offer = await getTodayAntiWasteOffer();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-ink pb-20 pt-28">
        <div className="container-page max-w-3xl">
          <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
            <Recycle className="h-8 w-8 text-gold" />
            Panier anti-gaspi
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Chaque soir, nous proposons un panier surprise composé des invendus
            du jour, à prix réduit. Une bonne affaire, et un geste contre le
            gaspillage alimentaire.
          </p>

          {!offer ? (
            <p className="mt-10 rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
              Pas de panier anti-gaspi disponible ce soir. Revenez demain en fin
              de journée !
            </p>
          ) : (
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-ink-soft">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-forest/15 p-5 sm:p-6">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-cream">
                    <Leaf className="h-5 w-5 text-green-300" />
                    {offer.title}
                  </h2>
                  <p className="mt-1 text-sm text-cream/75">
                    {offer.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-bold text-gold">
                    {formatPrice(offer.price)}
                  </p>
                  {offer.originalValue && offer.originalValue > offer.price && (
                    <p className="text-xs text-muted line-through">
                      valeur {formatPrice(offer.originalValue)}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <p className="mb-4 text-sm text-cream/80">
                  Retrait ce soir entre{" "}
                  <strong className="text-cream">{offer.pickupStart}</strong> et{" "}
                  <strong className="text-cream">{offer.pickupEnd}</strong>.{" "}
                  {offer.soldOut ? (
                    <span className="text-red-300">
                      Tous les paniers sont réservés.
                    </span>
                  ) : (
                    <span className="text-gold">
                      Plus que {offer.remaining} panier
                      {offer.remaining > 1 ? "s" : ""}.
                    </span>
                  )}
                </p>
                <AntiWasteReserveForm remaining={offer.remaining} />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
