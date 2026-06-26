import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Leaf, MessageCircle, Recycle, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AntiWasteReserveForm } from "@/components/AntiWasteReserveForm";
import { AntiWasteMobileOffer } from "@/components/AntiWasteMobileOffer";
import {
  getTodayAntiWasteOffer,
  type AntiWasteOfferView,
} from "@/lib/antiwaste";
import { siteConfig } from "@/lib/config";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panier anti-gaspi",
  description:
    "Réservez un plateau surprise anti-gaspillage à prix réduit, à retirer en fin de journée. Quantités limitées, contre le gaspillage alimentaire.",
};

const atoutsMobile = ["Retrait soir", "Prix réduit", "Zéro gaspi"];

const paniersExemples = [
  {
    name: "Grillades du soir",
    description: "Brochettes, kebabs et viandes grillées du jour.",
    image: "/images/hero-slide-grillades-turques.png",
    badge: "Maison",
  },
  {
    name: "Pide & lahmacun",
    description: "Pide et lahmacun préparés dans la journée.",
    image: "/images/hero-slide-pide-lahmacun.png",
    badge: "Du four",
  },
  {
    name: "Mezze & entrées",
    description: "Houmous, börek et assortiment de mezze.",
    image: "/images/about-3.jpg",
    badge: "À partager",
  },
  {
    name: "Desserts",
    description: "Baklava et douceurs turques selon la vitrine.",
    image: "/images/baklava.png",
    badge: "Sucré",
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
              <AntiWasteMobileOffer offer={offer} />
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

          <section className="hidden sm:block sm:pb-8">
            <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
              <Recycle className="h-8 w-8 text-gold" />
              Panier anti-gaspi
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted lg:text-base">
              Chaque soir, nous proposons un plateau surprise composé des
              invendus du jour, à prix réduit. Une bonne affaire, et un geste
              contre le gaspillage alimentaire.
            </p>

            {!offer ? (
              <DesktopNoOfferCard />
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
    <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-ink-soft shadow-[0_28px_85px_-62px_rgba(0,0,0,0.95)] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)]">
      <div className="flex flex-col justify-between gap-8 border-b border-white/10 bg-forest/15 p-5 sm:p-6 lg:border-b-0 lg:border-r">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-cream">
            <Leaf className="h-5 w-5 text-green-300" />
            {offer.title}
          </h2>
          <p className="mt-1 text-sm text-cream/75">{offer.description}</p>
        </div>
        <div>
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

function DesktopNoOfferCard() {
  return (
    <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_36%),#111111] shadow-[0_28px_85px_-62px_rgba(0,0,0,0.95)] lg:grid lg:h-[calc(100svh-17rem)] lg:max-h-[31rem] lg:min-h-[27rem] lg:grid-cols-[0.92fr_1.08fr]">
      <div className="relative min-h-[20rem] lg:min-h-0">
        <Image
          src="/images/hero-slide-grillades-turques.png"
          alt="Grillades et spécialités du jour pour les plateaux anti-gaspi"
          fill
          sizes="(max-width: 1024px) 100vw, 44vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-green-300">
            Publication selon invendus
          </p>
          <p className="mt-1 font-display text-xl font-bold leading-tight text-cream lg:text-2xl">
            Les paniers partent vite en fin de journée.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between p-5 lg:p-6">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-bold text-green-200 lg:text-sm">
            <Clock className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            Prochaine mise en ligne ce soir
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-cream lg:text-3xl">
            Aucun panier disponible pour le moment
          </h2>
          <p className="text-cream/72 mt-2 max-w-xl text-sm leading-6 lg:text-base">
            Les paniers anti-gaspi sont préparés uniquement avec les invendus du
            jour. Revenez en fin de journée ou contactez-nous pour connaître les
            disponibilités.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {paniersExemples.slice(0, 3).map((item) => (
            <article
              key={item.name}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]"
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="15vw"
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-cream lg:text-base">
                  {item.name}
                </p>
                <p className="mt-1 line-clamp-2 text-[0.72rem] leading-4 text-cream/60 lg:text-xs">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-ink shadow-[0_18px_40px_-28px_rgba(216,154,28,0.9)] transition hover:bg-gold-400"
          >
            <ShoppingBag className="h-4 w-4" />
            Voir la carte
          </Link>
          <a
            href={siteConfig.socials.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-green-500/60 px-6 text-sm font-bold text-green-300 transition hover:bg-green-500/10"
          >
            <MessageCircle className="h-4 w-4" />
            Demander sur WhatsApp
          </a>
        </div>
      </div>
    </div>
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
