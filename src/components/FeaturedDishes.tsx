import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { getMenuForBrowser } from "@/lib/dishes";

const specialtySlugs = ["adana-kebab", "iskender-kebab", "baklava"];

/** Grille des spécialités mises en avant sur l'accueil. */
export async function FeaturedDishes() {
  const { categories, dishes } = await getMenuForBrowser();
  const mobileCategories = groupMobileCategories(categories);
  const availableDishes = dishes.filter((dish) => dish.available);
  const specialtyDishes = specialtySlugs
    .map((slug) => availableDishes.find((dish) => dish.id === slug))
    .filter((dish): dish is (typeof availableDishes)[number] => Boolean(dish));
  const featured =
    specialtyDishes.length === specialtySlugs.length
      ? specialtyDishes
      : availableDishes.slice(0, 3);

  return (
    <section
      id="menu"
      className="bg-[#050505] pb-5 pt-3 text-cream sm:bg-[#F8F3EA] sm:pb-20 sm:pt-8 sm:text-ink lg:pb-24 lg:pt-10 3xl:pb-32 3xl:pt-14"
    >
      <div className="container-page">
        {categories.length > 0 && (
          <div className="mb-5 sm:hidden">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold leading-tight text-cream">
                Catégories
              </h2>
              <Link
                href="/menu"
                className="text-xs font-bold uppercase tracking-[0.18em] text-gold"
              >
                Menu
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mobileCategories.map((category) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className="group relative min-h-[7rem] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]"
                >
                  <Image
                    src={imageForCategory(category.imageSlug)}
                    alt=""
                    fill
                    sizes="50vw"
                    className="object-cover opacity-80 transition duration-500 group-hover:scale-105"
                  />
                  <div className="from-black/88 absolute inset-0 bg-gradient-to-t via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="line-clamp-2 font-display text-lg font-bold leading-tight text-cream">
                      {category.name}
                    </p>
                    <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-gold">
                      Voir
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold leading-tight text-cream sm:text-3xl sm:text-ink lg:text-4xl 3xl:text-5xl">
                Nos spécialités turques.
              </h2>
            </div>
            <div className="hidden sm:block xl:shrink-0">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink shadow-[0_12px_26px_-16px_rgba(239,164,29,0.95)] transition hover:-translate-y-0.5 hover:bg-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 3xl:px-8 3xl:py-3 3xl:text-base"
              >
                Voir tout le menu
                <ArrowRight className="h-4 w-4 motion-safe:animate-pulse" />
              </Link>
            </div>
          </div>
          <div className="max-w-4xl">
            <p className="hidden text-sm leading-7 text-ink/70 sm:block sm:text-base 3xl:text-lg 3xl:leading-8">
              Adana kebab, İskender kebab et baklava : trois signatures à
              commander rapidement.
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 3xl:mt-10 3xl:gap-7">
          {featured.map((dish, i) => (
            <div key={dish.id}>
              <DishCard
                dish={dish}
                priority={i < 3}
                href={dish.hasOptions ? `/menu/${dish.id}` : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function imageForCategory(slug: string) {
  if (
    slug.includes("grillade") ||
    slug.includes("kebab") ||
    slug.includes("kofte")
  ) {
    return "/images/hero-slide-grillades-turques.png";
  }
  if (slug.includes("pide") || slug.includes("lahmacun")) {
    return "/images/hero-slide-pide-lahmacun.png";
  }
  if (
    slug.includes("dessert") ||
    slug.includes("baklava") ||
    slug.includes("sutlac")
  ) {
    return "/images/hero-slide-desserts-turcs.png";
  }
  if (
    slug.includes("boisson") ||
    slug.includes("ayran") ||
    slug.includes("the-turc")
  ) {
    return "/images/hero-slide-boissons-turques.png";
  }
  if (
    slug.includes("entree") ||
    slug.includes("mezze") ||
    slug.includes("houmous") ||
    slug.includes("borek") ||
    slug.includes("manti") ||
    slug.includes("specialite")
  ) {
    return "/images/about-3.jpg";
  }
  return "/images/hero-plateau-turc-premium.png";
}

function groupMobileCategories(
  categories: Array<{ id: string; slug: string; name: string }>,
) {
  // Restaurant : chaque catégorie pointe vers sa propre ancre de menu.
  return categories.map((category) => ({
    ...category,
    href: `/menu#${category.slug}`,
    imageSlug: category.slug,
  }));
}
