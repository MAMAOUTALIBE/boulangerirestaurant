"use client";

import { useMemo, useState } from "react";
import {
  CupSoda,
  Flame,
  IceCreamBowl,
  Pizza,
  Search,
  Soup,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { Reveal } from "@/components/ui/Reveal";
import type { Dish } from "@/types";

export interface BrowserDish extends Dish {
  available: boolean;
  hasOptions: boolean;
  remaining: number | null;
  soldOut: boolean;
  categoryId: string;
}
export interface BrowserCategory {
  id: string;
  slug: string;
  name: string;
}

interface DisplayCategory extends BrowserCategory {
  sourceIds: string[];
}

const popularDishIds = new Set([
  "adana-kebab",
  "iskender-kebab",
  "lahmacun",
  "baklava",
]);

const dishDetails: Record<string, string[]> = {
  "adana-kebab": ["Agneau", "Grillé au charbon", "Épicé"],
  "iskender-kebab": ["Sur pain pide", "Sauce tomate", "Yaourt"],
  "kebab-grille": ["Mariné", "Grillé au charbon", "Accompagnement"],
  kofte: ["Boulettes", "Grillé", "Épices"],
  lahmacun: ["Viande hachée", "Croustillant", "À rouler"],
  "pide-sucuk": ["Sucuk", "Fromage", "Au four"],
  manti: ["Raviolis", "Yaourt à l'ail", "Beurre paprika"],
  "mercimek-corbasi": ["Lentilles corail", "Cumin", "Chaud"],
  houmous: ["Pois chiches", "Tahini", "Végétarien"],
  "borek-fromage": ["Yufka", "Fromage", "Croustillant"],
  baklava: ["Pistaches", "Pâte filo", "Miel"],
  sutlac: ["Riz au lait", "Vanille", "Gratiné"],
  ayran: ["Yaourt", "Frais", "Sans alcool"],
  "the-turc": ["Thé noir", "Verre tulipe", "Sans alcool"],
  "sodas-frais": ["33 cl", "Frais", "Sans alcool"],
};

/** Menu interactif : recherche plein-texte + filtres catégorie. */
export function MenuBrowser({
  categories,
  dishes,
}: {
  categories: BrowserCategory[];
  dishes: BrowserDish[];
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const displayCategories = useMemo(
    () => toDisplayCategories(categories),
    [categories],
  );
  const categoryFilters = useMemo(
    () =>
      displayCategories.map((category) => ({
        id: category.slug,
        label: category.name,
        Icon: iconForCategory(category.slug),
      })),
    [displayCategories],
  );

  const filtered = useMemo(() => {
    const list = dishes.filter((d) => {
      const category = categoryById.get(d.categoryId);
      if (!matchesQuickFilter(category?.slug, filter)) return false;
      if (q.trim()) {
        const n = q.toLowerCase();
        return (
          d.name.toLowerCase().includes(n) ||
          d.description.toLowerCase().includes(n)
        );
      }
      return true;
    });
    return list;
  }, [categoryById, dishes, filter, q]);

  // Regroupe par catégorie dans l'ordre éditorial du menu.
  const grouped = useMemo(() => {
    if (filter !== "all" || q.trim()) return null;
    return displayCategories
      .map((c) => ({
        cat: c,
        items: filtered.filter((d) => c.sourceIds.includes(d.categoryId)),
      }))
      .filter((g) => g.items.length > 0);
  }, [displayCategories, filter, filtered, q]);

  return (
    <div>
      {/* Barre de recherche + filtres (sombre, glissée sous la pilule du header) */}
      <div className="sticky top-[4.85rem] z-10 -mx-4 mb-4 border-b border-white/10 bg-ink/90 px-4 py-2.5 backdrop-blur-xl sm:top-28 sm:mb-10 sm:py-4 3xl:top-32 3xl:py-5">
        <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/35 3xl:left-4 3xl:h-5 3xl:w-5" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-cream placeholder:text-cream/40 focus:border-gold-400 focus:outline-none sm:py-2.5 3xl:py-3.5 3xl:pl-12 3xl:text-base"
            />
          </div>
        </div>

        <div className="-mx-4 mt-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              <Star className="h-3.5 w-3.5" />
              Tout
            </Chip>
            {categoryFilters.map(({ id, label, Icon }) => (
              <Chip
                key={id}
                active={filter === id}
                onClick={() => setFilter(id)}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-3 hidden flex-wrap gap-2 sm:flex 3xl:gap-3">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            <Star className="h-4 w-4" />
            Tout
          </Chip>
          {categoryFilters.map(({ id, label, Icon }) => (
            <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
              <Icon className="h-4 w-4" />
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-cream/50">
          Aucun produit ne correspond.
        </p>
      ) : grouped ? (
        grouped.map((g, gi) => (
          <section
            key={g.cat.id}
            id={g.cat.slug}
            className="mb-5 scroll-mt-40 last:mb-0 sm:mb-12 sm:scroll-mt-44"
          >
            <div className="flex items-baseline gap-2.5 sm:gap-4">
              <span className="font-display text-xs font-semibold tracking-wider text-gold-400 sm:text-sm">
                {String(gi + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-xl font-bold text-cream sm:text-3xl">
                {g.cat.name}
              </h2>
              <span className="h-px flex-1 bg-white/10" />
              <span className="shrink-0 text-xs text-cream/40 sm:text-sm">
                {g.items.length} produit{g.items.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6">
              {g.items.map((dish, i) => (
                <MenuDishCard
                  key={dish.id}
                  dish={dish}
                  delay={0.04 * i}
                  priority={gi === 0 && i < 3}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6">
          {filtered.map((dish, i) => (
            <MenuDishCard
              key={dish.id}
              dish={dish}
              delay={0.03 * i}
              priority={i < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuDishCard({
  dish,
  delay,
  priority,
}: {
  dish: BrowserDish;
  delay: number;
  priority: boolean;
}) {
  const renderCard = () => (
    <DishCard
      dish={withDisplayTag(dish)}
      badges={getDishBadges(dish)}
      details={getDishDetails(dish)}
      priority={priority}
      unavailable={!dish.available || dish.soldOut}
      lowStock={dish.remaining}
      href={dish.hasOptions ? `/menu/${dish.id}` : undefined}
    />
  );

  return (
    <>
      <div className="sm:hidden">{renderCard()}</div>
      <Reveal className="hidden sm:block" delay={delay}>
        {renderCard()}
      </Reveal>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition sm:px-4 3xl:px-5 3xl:py-2 3xl:text-base ${
        active
          ? "bg-gold text-ink shadow-[0_10px_26px_-16px_rgba(245,158,11,0.95)]"
          : "border border-white/15 text-cream/70 hover:border-gold-400/50 hover:text-cream"
      }`}
    >
      {children}
    </button>
  );
}

function matchesQuickFilter(categorySlug: string | undefined, filter: string) {
  if (filter === "all") return true;
  return categorySlug === filter;
}

function iconForCategory(slug: string): LucideIcon {
  if (slug.includes("grillade") || slug.includes("kebab")) return Flame;
  if (slug.includes("pide") || slug.includes("lahmacun")) return Pizza;
  if (slug.includes("entree") || slug.includes("mezze")) return Soup;
  if (slug.includes("dessert")) return IceCreamBowl;
  if (slug.includes("boisson")) return CupSoda;
  return UtensilsCrossed;
}

// Restaurant : chaque catégorie a son propre onglet (pas de regroupement).
function toDisplayCategories(categories: BrowserCategory[]): DisplayCategory[] {
  return categories.map((category) => ({
    ...category,
    sourceIds: [category.id],
  }));
}

function withDisplayTag(dish: BrowserDish): BrowserDish {
  if (dish.tag || !popularDishIds.has(dish.id)) return dish;
  return { ...dish, tag: "Populaire" };
}

function getDishBadges(dish: BrowserDish) {
  const badges = [];
  if (popularDishIds.has(dish.id)) badges.push("Populaire");
  if (dish.hasOptions) badges.push("Options");
  return badges;
}

function getDishDetails(dish: BrowserDish) {
  return (
    dishDetails[dish.id] ??
    (dish.hasOptions ? ["Accompagnement", "Sauce", "Boisson"] : [])
  );
}
