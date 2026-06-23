import type { Metadata } from "next";
import Image from "next/image";
import {
  ChevronDown,
  Clock,
  Leaf,
  PackageCheck,
  Recycle,
  ShoppingBag,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AntiWasteReserveForm } from "@/components/AntiWasteReserveForm";
import {
  getTodayAntiWasteOffer,
  type AntiWasteOfferView,
} from "@/lib/antiwaste";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panier anti-gaspi",
  description:
    "Réservez un panier surprise anti-gaspillage à prix réduit, à retirer en fin de journée. Quantités limitées, contre le gaspillage alimentaire.",
};

const atoutsMobile = ["Retrait soir", "Prix réduit", "Zéro gaspi"];

const paniersExemples = [
  {
    name: "Pains du jour",
    description: "Baguettes, pains spéciaux et tranches gourmandes.",
    image: "/images/boulangerie-pains.webp",
    badge: "Boulangerie",
  },
  {
    name: "Viennoiseries",
    description: "Croissants, pains au chocolat et brioches du matin.",
    image: "/images/boulangerie-viennoiseries.webp",
    badge: "Pur beurre",
  },
  {
    name: "Douceurs",
    description: "Parts de tarte, cakes et pâtisseries selon vitrine.",
    image: "/images/boulangerie-patisseries.webp",
    badge: "Sucré",
  },
  {
    name: "Snacking",
    description: "Sandwichs, quiches et salades disponibles le soir.",
    image: "/images/boulangerie-snacking.webp",
    badge: "Midi",
  },
];

export default async function AntiGaspiPage() {
  const offer = await getTodayAntiWasteOffer();

  return (
    <>
      <Header />
      <main className="bg-ink pb-0 pt-20 sm:pt-28">
        <div className="container-page max-w-5xl">
          <section className="pt-5 min-[390px]:pt-7 sm:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="flex items-center gap-2 font-display text-[1.76rem] font-bold leading-tight text-cream">
                  <Recycle className="h-6 w-6 shrink-0 text-gold" />
                  Panier anti-gaspi
                </h1>
                <p className="mt-1.5 text-[0.82rem] leading-5 text-muted min-[390px]:text-sm">
                  Des invendus du jour à prix doux, retrait ce soir.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-gold">
                {offer ? "Ouvert" : "Ce soir"}
              </span>
            </div>

            <ul className="mt-2.5 grid grid-cols-3 gap-1.5 min-[390px]:mt-3 min-[390px]:gap-2">
              {atoutsMobile.map((atout) => (
                <li
                  key={atout}
                  className="flex min-h-8 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.07] px-2 text-center text-[0.66rem] font-semibold text-cream/85 min-[390px]:min-h-9 min-[390px]:text-[0.7rem]"
                >
                  {atout}
                </li>
              ))}
            </ul>

            {offer ? (
              <MobileAntiWasteOffer offer={offer} />
            ) : (
              <MobileNoOfferCard />
            )}

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-gold">
                  Dans le panier
                </h2>
                <span className="text-xs text-muted">Selon invendus</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {paniersExemples.map((item) => (
                  <MobileBasketExample key={item.name} item={item} />
                ))}
              </div>
            </div>
          </section>

          <section className="hidden sm:block">
            <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
              <Recycle className="h-8 w-8 text-gold" />
              Panier anti-gaspi
            </h1>
            <p className="mt-3 max-w-2xl text-muted">
              Chaque soir, nous proposons un panier surprise composé des
              invendus du jour, à prix réduit. Une bonne affaire, et un geste
              contre le gaspillage alimentaire.
            </p>

            {!offer ? (
              <p className="mt-10 rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
                Pas de panier anti-gaspi disponible ce soir. Revenez demain en
                fin de journée !
              </p>
            ) : (
              <DesktopAntiWasteOffer offer={offer} />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function DesktopAntiWasteOffer({ offer }: { offer: AntiWasteOfferView }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-ink-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-forest/15 p-5 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-cream">
            <Leaf className="h-5 w-5 text-green-300" />
            {offer.title}
          </h2>
          <p className="mt-1 text-sm text-cream/75">{offer.description}</p>
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
  );
}

function MobileAntiWasteOffer({ offer }: { offer: AntiWasteOfferView }) {
  return (
    <article className="mt-3 overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_42%),#111111] shadow-[0_22px_60px_-50px_rgba(245,158,11,0.75)]">
      <div className="grid grid-cols-[7.5rem_1fr] gap-3 p-2.5">
        <div className="relative min-h-[8.25rem] overflow-hidden rounded-xl">
          <Image
            src="/images/boulangerie-hero.webp"
            alt="Pains et viennoiseries en boutique"
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

      <details className="group border-t border-white/10">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-bold text-gold [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Réserver
          </span>
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="px-3 pb-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[0.72rem] text-muted">
            <Clock className="h-3.5 w-3.5 text-gold" />
            Paiement sur place au retrait.
          </p>
          <AntiWasteReserveForm remaining={offer.remaining} />
        </div>
      </details>
    </article>
  );
}

function MobileNoOfferCard() {
  return (
    <div className="mt-3 rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_42%),#111111] p-3">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-cream">
            Aucun panier actif pour ce soir.
          </p>
          <p className="mt-1 text-sm leading-5 text-muted">
            Les paniers sont publiés selon les invendus, souvent en fin de
            journée.
          </p>
        </div>
      </div>
    </div>
  );
}

function MobileBasketExample({
  item,
}: {
  item: (typeof paniersExemples)[number];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <div className="relative aspect-[4/3]">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="50vw"
          className="object-cover"
        />
        <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-1 text-[0.62rem] font-bold text-gold backdrop-blur">
          {item.badge}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="font-display text-base font-bold leading-tight text-cream">
          {item.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.72rem] leading-4 text-cream/65">
          {item.description}
        </p>
      </div>
    </article>
  );
}
