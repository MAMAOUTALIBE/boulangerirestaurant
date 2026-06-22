import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { getMenuForBrowser } from "@/lib/dishes";

const specialtySlugs = [
  "baguette-tradition",
  "croissant-beurre",
  "tartelette-fruits",
];

/** Grille des spécialités mises en avant sur l'accueil. */
export async function FeaturedDishes() {
  const { dishes } = await getMenuForBrowser();
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
      className="bg-[#F8F3EA] pb-16 pt-6 text-ink sm:pb-20 sm:pt-8 lg:pb-24 lg:pt-10 3xl:pb-32 3xl:pt-14"
    >
      <div className="container-page">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl 3xl:text-5xl">
                Nos spécialités boulangères.
              </h2>
            </div>
            <div className="xl:shrink-0">
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
            <p className="text-ink/68 text-sm leading-7 sm:text-base 3xl:text-lg 3xl:leading-8">
              Baguette tradition, croissant pur beurre et tartelette de saison :
              trois signatures à commander rapidement.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 3xl:mt-10 3xl:gap-7">
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
