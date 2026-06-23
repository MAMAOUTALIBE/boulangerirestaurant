import type { Metadata } from "next";
import Image from "next/image";
import { ChevronDown, Clock, Gift, ShoppingBag, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SeasonalPreorderForm } from "@/components/SeasonalPreorderForm";
import {
  getActiveSeasonalProducts,
  type SeasonalProductView,
} from "@/lib/seasonal";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique de saison",
  description:
    "Précommandez nos spécialités de saison : galette des rois, bûches de Noël et pièces de fête. Quantités limitées, retrait en boutique.",
};

const atoutsMobile = [
  "Retrait boutique",
  "Quantités limitées",
  "Paiement retrait",
];

const saisonSuggestions = [
  {
    name: "Panier du matin",
    description: "Pains, croissants et douceurs du jour à partager.",
    image: "/images/boulangerie-hero.webp",
    badge: "Matin",
    price: "À partir de 12,90 €",
  },
  {
    name: "Couronne briochée",
    description: "Brioche pur beurre, sucre perlé et notes d'agrumes.",
    image: "/images/boulangerie-viennoiseries.webp",
    badge: "Week-end",
    price: "À partir de 9,50 €",
  },
  {
    name: "Pain apéritif",
    description: "Pain garni à partager, idéal pour les beaux jours.",
    image: "/images/boulangerie-pains.webp",
    badge: "À partager",
    price: "Sur commande",
  },
  {
    name: "Plateau gourmand",
    description: "Mini pâtisseries et viennoiseries pour vos événements.",
    image: "/images/boulangerie-snacking.webp",
    badge: "Traiteur",
    price: "Sur devis",
  },
];

export default async function BoutiqueDeSaisonPage() {
  const products = await getActiveSeasonalProducts();

  return (
    <>
      <Header />
      <main className="bg-ink pb-0 pt-20 sm:pt-28">
        <div className="container-page max-w-5xl">
          <section className="pt-5 min-[390px]:pt-7 sm:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="flex items-center gap-2 font-display text-[1.72rem] font-bold leading-tight text-cream">
                  <Sparkles className="h-6 w-6 shrink-0 text-gold" />
                  Boutique de saison
                </h1>
                <p className="mt-1.5 text-[0.82rem] leading-5 text-muted min-[390px]:mt-2 min-[390px]:text-sm">
                  Précommandes limitées, retrait en boutique.
                </p>
              </div>
              {products.length > 0 && (
                <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-gold">
                  {products.length} offre{products.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <ul className="mt-2.5 grid grid-cols-3 gap-1.5 min-[390px]:mt-3 min-[390px]:gap-2">
              {atoutsMobile.map((a) => (
                <li
                  key={a}
                  className="flex min-h-8 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.07] px-2 text-center text-[0.66rem] font-semibold text-cream/85 min-[390px]:min-h-9 min-[390px]:text-[0.7rem]"
                >
                  {a}
                </li>
              ))}
            </ul>

            {products.length > 0 ? (
              <div className="mt-3 space-y-3">
                {products.map((product, index) => (
                  <MobileSeasonalProduct
                    key={product.id}
                    product={product}
                    featured={index === 0}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_42%),#111111] p-3 text-sm text-cream/80">
                <p className="font-semibold text-cream">
                  Aucune précommande ouverte aujourd&apos;hui.
                </p>
                <p className="mt-1 text-muted">
                  Voici la collection saisonnière préparée en boutique selon les
                  arrivages.
                </p>
              </div>
            )}

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-gold">
                  Collection
                </h2>
                <span className="text-xs text-muted">Selon arrivage</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {saisonSuggestions.map((item) => (
                  <MobileSeasonalIdea key={item.name} item={item} />
                ))}
              </div>
            </div>
          </section>

          <section className="hidden sm:block">
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
                {products.map((product) => (
                  <DesktopSeasonalProduct key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function DesktopSeasonalProduct({ product }: { product: SeasonalProductView }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-ink-soft">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-gold backdrop-blur">
          {formatPrice(product.price)}
        </span>
        {product.soldOut ? (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-red-300 backdrop-blur">
            Complet
          </span>
        ) : (
          product.remaining <= 10 && (
            <span className="absolute right-3 top-3 rounded-full bg-gold/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
              Plus que {product.remaining}
            </span>
          )
        )}
      </div>
      <div className="p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold text-cream">
          {product.name}
        </h2>
        <p className="mt-1.5 text-sm text-cream/75">{product.description}</p>
        <p className="mt-2 text-xs text-muted">
          Précommandes jusqu&apos;au {product.salesEndLabel} · retrait du{" "}
          {product.pickupStart} au {product.pickupEnd}
        </p>
        <div className="mt-4 border-t border-white/10 pt-4">
          <SeasonalPreorderForm
            slug={product.slug}
            remaining={product.remaining}
            pickupStart={product.pickupStart}
            pickupEnd={product.pickupEnd}
          />
        </div>
      </div>
    </article>
  );
}

function MobileSeasonalProduct({
  product,
  featured,
}: {
  product: SeasonalProductView;
  featured: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_42%),#111111] shadow-[0_22px_60px_-50px_rgba(245,158,11,0.75)]">
      <div className="grid grid-cols-[7.5rem_1fr] gap-3 p-2.5">
        <div className="relative min-h-[8.25rem] overflow-hidden rounded-xl">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="120px"
            className="object-cover"
          />
          <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-1 text-[0.65rem] font-bold text-gold backdrop-blur">
            {formatPrice(product.price)}
          </span>
        </div>
        <div className="min-w-0 py-1 pr-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-lg font-bold leading-tight text-cream">
              {product.name}
            </h2>
            {featured && <Gift className="mt-0.5 h-4 w-4 shrink-0 text-gold" />}
          </div>
          <p className="mt-1 line-clamp-2 text-[0.78rem] leading-4 text-cream/70">
            {product.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/10 px-2 py-1 text-[0.66rem] font-semibold text-cream/70">
              Retrait {product.pickupStart}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-[0.66rem] font-bold ${
                product.soldOut
                  ? "bg-red-500/15 text-red-200"
                  : "bg-gold/90 text-ink"
              }`}
            >
              {product.soldOut ? "Complet" : `${product.remaining} dispo`}
            </span>
          </div>
        </div>
      </div>

      <details className="group border-t border-white/10">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-bold text-gold [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Précommander
          </span>
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="px-3 pb-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[0.72rem] text-muted">
            <Clock className="h-3.5 w-3.5 text-gold" />
            Jusqu&apos;au {product.salesEndLabel}
          </p>
          <SeasonalPreorderForm
            slug={product.slug}
            remaining={product.remaining}
            pickupStart={product.pickupStart}
            pickupEnd={product.pickupEnd}
          />
        </div>
      </details>
    </article>
  );
}

function MobileSeasonalIdea({
  item,
}: {
  item: (typeof saisonSuggestions)[number];
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
        <p className="mt-2 text-[0.72rem] font-bold text-gold">{item.price}</p>
      </div>
    </article>
  );
}
