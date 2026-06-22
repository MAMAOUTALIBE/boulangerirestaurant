import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { getDishWithOptions } from "@/lib/dishes";
import { DishOrderPanel } from "@/components/DishOrderPanel";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Métadonnées SEO dynamiques par produit (titre, description, image de partage). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dish = await getDishWithOptions(slug);
  if (!dish) return { title: "Plat introuvable" };

  const description = `${dish.description} — ${formatPrice(dish.price)}. Commandez ${dish.name} chez ${siteConfig.name}, boulangerie artisanale à Juvisy-sur-Orge.`;
  return {
    title: dish.name,
    description,
    alternates: { canonical: `/menu/${dish.slug}` },
    openGraph: {
      title: `${dish.name} | ${siteConfig.name}`,
      description,
      type: "website",
      url: `${siteConfig.url}/menu/${dish.slug}`,
      images: [{ url: dish.image, width: 1200, height: 1200, alt: dish.name }],
    },
  };
}

export default async function DishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = await getDishWithOptions(slug);
  if (!dish) notFound();

  // Données structurées Product/Offer → rich snippets Google (prix, dispo).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: dish.name,
    description: dish.description,
    image: `${siteConfig.url}${dish.image}`,
    ...(dish.category ? { category: dish.category.name } : {}),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      price: dish.price.toFixed(2),
      priceCurrency: "EUR",
      availability: dish.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}/menu/${dish.slug}`,
    },
  };

  const groups = dish.optionGroups.map((g) => ({
    id: g.id,
    name: g.name,
    type: g.type,
    required: g.required,
    options: g.options.map((o) => ({
      id: o.id,
      name: o.name,
      priceDelta: o.priceDelta,
    })),
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="min-h-screen bg-ink pb-20 pt-28">
        <div className="container-page max-w-4xl">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au menu
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image
                src={dish.image}
                alt={dish.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-cream sm:text-4xl">
                {dish.name}
              </h1>
              <p className="mt-2 text-muted">{dish.description}</p>
              <p className="mt-2 font-display text-2xl font-bold text-gold">
                {formatPrice(dish.price)}
              </p>

              {!dish.available ? (
                <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                  Ce produit est actuellement épuisé.
                </p>
              ) : (
                <div className="mt-6">
                  <DishOrderPanel
                    dish={{
                      slug: dish.slug,
                      name: dish.name,
                      image: dish.image,
                      basePrice: dish.price,
                    }}
                    groups={groups}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
