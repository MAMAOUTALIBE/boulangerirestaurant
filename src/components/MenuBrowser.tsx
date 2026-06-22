"use client";

import { useMemo, useState } from "react";
import {
  CakeSlice,
  ChevronDown,
  Croissant,
  CupSoda,
  Sandwich,
  Search,
  Star,
  Wheat,
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

type MenuFilter =
  | "all"
  | "pains"
  | "viennoiseries"
  | "patisseries"
  | "snacking"
  | "boissons";

const quickFilters: {
  id: MenuFilter;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "all", label: "Tout", Icon: Star },
  { id: "pains", label: "Pains", Icon: Wheat },
  { id: "viennoiseries", label: "Viennoiseries", Icon: Croissant },
  { id: "patisseries", label: "Pâtisseries", Icon: CakeSlice },
  { id: "snacking", label: "Snacking", Icon: Sandwich },
  { id: "boissons", label: "Boissons", Icon: CupSoda },
];

const categoryFilters = quickFilters.filter(({ id }) => id !== "all");

const popularDishIds = new Set([
  "baguette-tradition",
  "croissant-beurre",
  "pain-chocolat",
  "tartelette-fruits",
]);

const dishDetails: Record<string, string[]> = {
  "baguette-tradition": ["Levain", "Cuisson du jour", "Gluten"],
  "pain-levain": ["Levain naturel", "Tranchage possible", "Gluten"],
  "pain-complet-graines": ["Graines", "Farine complète", "Gluten"],
  "croissant-beurre": ["Pur beurre", "Feuilletage maison", "Lait/gluten"],
  "pain-chocolat": ["Chocolat noir", "Pur beurre", "Lait/gluten"],
  "chausson-pommes": ["Pommes", "Pur beurre", "Gluten"],
  "brioche-tressee": ["Moelleuse", "Beurre", "Lait/gluten"],
  "tartelette-fruits": ["Fruits de saison", "Crème légère", "Gluten/lait"],
  "eclair-chocolat": ["Chocolat", "Pâte à choux", "Lait/gluten"],
  "flan-patissier": ["Vanille", "Pâte croustillante", "Lait/gluten"],
  "paris-brest": ["Praliné", "Amandes", "Fruits à coque"],
  "sandwich-baguette-poulet": ["Pain au choix", "Suppléments", "Gluten"],
  "quiche-lorraine": ["Part déjeuner", "À réchauffer", "Lait/gluten"],
  "cafe-allonge": ["Chaud", "Café moulu", "Sans alcool"],
  "jus-orange-presse": ["Pressé minute", "Frais", "Sans alcool"],
  "chocolat-chaud": ["Chaud", "Lait", "Chocolat"],
};

/** Menu interactif : recherche plein-texte + filtres catégorie / dispo / prix. */
export function MenuBrowser({
  categories,
  dishes,
}: {
  categories: BrowserCategory[];
  dishes: BrowserDish[];
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<MenuFilter>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc">(
    "default",
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const selectedCategory = categoryFilters.find(({ id }) => id === filter);
  const CategoryIcon = selectedCategory?.Icon ?? Croissant;

  const filtered = useMemo(() => {
    let list = dishes.filter((d) => {
      const category = categoryById.get(d.categoryId);
      if (!matchesQuickFilter(d, category?.slug, filter)) return false;
      if (onlyAvailable && (!d.available || d.soldOut)) return false;
      if (q.trim()) {
        const n = q.toLowerCase();
        return (
          d.name.toLowerCase().includes(n) ||
          d.description.toLowerCase().includes(n)
        );
      }
      return true;
    });
    if (sort === "price-asc")
      list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc")
      list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [categoryById, dishes, filter, q, onlyAvailable, sort]);

  // Regroupe par catégorie (ordre des catégories), sauf si tri prix actif.
  const grouped = useMemo(() => {
    if (sort !== "default" || filter !== "all" || q.trim()) return null;
    return categories
      .map((c) => ({
        cat: c,
        items: filtered.filter((d) => d.categoryId === c.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [categories, filter, filtered, q, sort]);

  return (
    <div>
      {/* Barre de recherche + filtres (sombre, glissée sous la pilule du header) */}
      <div className="sticky top-[5.25rem] z-10 -mx-4 mb-6 border-b border-white/10 bg-ink/88 px-4 py-3 backdrop-blur-xl sm:top-28 sm:mb-10 sm:py-4 3xl:top-32 3xl:py-5">
        <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/35 3xl:left-4 3xl:h-5 3xl:w-5" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="border-white/12 w-full rounded-full border bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-cream placeholder:text-cream/40 focus:border-gold-400 focus:outline-none 3xl:py-3.5 3xl:pl-12 3xl:text-base"
            />
          </div>
          <div className="flex items-center gap-2.5 lg:contents">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="border-white/12 min-w-0 flex-1 rounded-full border bg-white/[0.04] px-3 py-2.5 text-sm text-cream focus:border-gold-400 focus:outline-none sm:px-4 lg:flex-none 3xl:py-3.5 3xl:text-base [&>option]:text-ink"
            >
              <option value="default">Tri : par catégorie</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
            <label className="flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-full border border-white/12 px-3 text-sm text-cream/75 3xl:text-base">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="accent-gold-400"
              />
              <span className="hidden min-[380px]:inline">Disponibles</span>
              <span className="min-[380px]:hidden">Dispo.</span>
            </label>
          </div>
        </div>

        <div className="-mx-4 mt-2.5 px-4 pb-1 sm:hidden">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              <Star className="h-4 w-4" />
              Tout
            </Chip>

            <label
              className={`relative flex min-h-[2.75rem] min-w-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                selectedCategory
                  ? "border-forest-600 bg-forest-600 text-cream shadow-[0_10px_26px_-16px_rgba(27,94,54,0.95)]"
                  : "border-white/15 text-cream/70"
              }`}
            >
              <CategoryIcon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {selectedCategory?.label ?? "Catégories"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-80" />
              <select
                aria-label="Choisir une catégorie"
                value={selectedCategory?.id ?? ""}
                onChange={(event) =>
                  setFilter((event.target.value || "all") as MenuFilter)
                }
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              >
                <option value="">Catégories</option>
                {categoryFilters.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-3 hidden flex-wrap gap-2 sm:flex 3xl:gap-3">
          {quickFilters.map(({ id, label, Icon }) => (
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
            className="mb-12 scroll-mt-44"
          >
            <div className="flex items-baseline gap-4">
              <span className="font-display text-sm font-semibold tracking-wider text-gold-400">
                {String(gi + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-2xl font-bold text-cream sm:text-3xl">
                {g.cat.name}
              </h2>
              <span className="h-px flex-1 bg-white/10" />
              <span className="shrink-0 text-sm text-cream/40">
                {g.items.length} produit{g.items.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6">
              {g.items.map((dish, i) => (
                <Reveal key={dish.id} delay={0.04 * i}>
                  <DishCard
                    dish={withDisplayTag(dish)}
                    badges={getDishBadges(dish)}
                    details={getDishDetails(dish)}
                    priority={gi === 0 && i < 3}
                    unavailable={!dish.available || dish.soldOut}
                    lowStock={dish.remaining}
                    href={dish.hasOptions ? `/menu/${dish.id}` : undefined}
                  />
                </Reveal>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6">
          {filtered.map((dish, i) => (
            <Reveal key={dish.id} delay={0.03 * i}>
              <DishCard
                dish={withDisplayTag(dish)}
                badges={getDishBadges(dish)}
                details={getDishDetails(dish)}
                priority={i < 3}
                unavailable={!dish.available || dish.soldOut}
                lowStock={dish.remaining}
                href={dish.hasOptions ? `/menu/${dish.id}` : undefined}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
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
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition 3xl:px-5 3xl:py-2 3xl:text-base ${
        active
          ? "bg-forest-600 text-cream shadow-[0_10px_26px_-16px_rgba(27,94,54,0.95)]"
          : "border border-white/15 text-cream/70 hover:border-gold-400/50 hover:text-cream"
      }`}
    >
      {children}
    </button>
  );
}

function matchesQuickFilter(
  dish: BrowserDish,
  categorySlug: string | undefined,
  filter: MenuFilter,
) {
  const text = `${dish.id} ${dish.name} ${dish.description}`.toLowerCase();
  if (filter === "all") return true;
  if (filter === "pains") return categorySlug === "pains";
  if (filter === "viennoiseries") return categorySlug === "viennoiseries";
  if (filter === "patisseries") return categorySlug === "patisseries";
  if (filter === "snacking") return categorySlug === "snacking";
  if (filter === "boissons") return categorySlug === "boissons";
  return text.includes(filter);
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
    (dish.hasOptions ? ["Pain", "Boisson", "Supplément"] : [])
  );
}
