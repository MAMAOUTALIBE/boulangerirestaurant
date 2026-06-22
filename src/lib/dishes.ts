import "server-only";
import type { Dish as DishRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Dish } from "@/types";
import { remainingStock, isSoldOut } from "@/lib/stock";

const dishImageOverrides: Record<string, string> = {
  "baguette-tradition": "/images/boulangerie-pains.webp",
  "brioche-tressee": "/images/boulangerie-viennoiseries.webp",
  "cafe-allonge": "/images/boulangerie-snacking.webp",
  "chausson-pommes": "/images/boulangerie-viennoiseries.webp",
  "chocolat-chaud": "/images/boulangerie-snacking.webp",
  "croissant-beurre": "/images/boulangerie-viennoiseries.webp",
  "eclair-chocolat": "/images/boulangerie-patisseries.webp",
  "flan-patissier": "/images/boulangerie-patisseries.webp",
  "jus-orange-presse": "/images/boulangerie-snacking.webp",
  "pain-chocolat": "/images/boulangerie-viennoiseries.webp",
  "pain-complet-graines": "/images/boulangerie-pains.webp",
  "pain-levain": "/images/boulangerie-pains.webp",
  "paris-brest": "/images/boulangerie-patisseries.webp",
  "quiche-lorraine": "/images/boulangerie-snacking.webp",
  "sandwich-baguette-poulet": "/images/boulangerie-snacking.webp",
  "tartelette-fruits": "/images/boulangerie-patisseries.webp",
};

const publicMenuCategorySlugs = [
  "pains",
  "viennoiseries",
  "patisseries",
  "snacking",
  "boissons",
];

const publicMenuDishSlugs = [
  "baguette-tradition",
  "pain-levain",
  "pain-complet-graines",
  "croissant-beurre",
  "pain-chocolat",
  "chausson-pommes",
  "brioche-tressee",
  "tartelette-fruits",
  "eclair-chocolat",
  "flan-patissier",
  "paris-brest",
  "sandwich-baguette-poulet",
  "quiche-lorraine",
  "cafe-allonge",
  "jus-orange-presse",
  "chocolat-chaud",
];

function resolveDishImage(row: Pick<DishRow, "slug" | "image">): string {
  return dishImageOverrides[row.slug] ?? row.image;
}

function withDishPresentation<T extends { slug: string; image: string }>(
  row: T,
): T {
  return {
    ...row,
    image: dishImageOverrides[row.slug] ?? row.image,
  };
}

/** Convertit une ligne Prisma en `Dish` applicatif (id = slug, stable). */
function toDish(row: DishRow): Dish {
  return {
    id: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    image: resolveDishImage(row),
    tag: row.tag ?? undefined,
  };
}

/** Plats visibles sur le site public (disponibles, triés). */
export async function getDishes(): Promise<Dish[]> {
  const rows = await prisma.dish.findMany({
    where: {
      available: true,
      slug: { in: publicMenuDishSlugs },
      category: { is: { slug: { in: publicMenuCategorySlugs } } },
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    distinct: ["slug"],
  });
  return rows.filter((row) => !isSoldOut(row)).map(toDish);
}

/** Données back-office du menu : catégories + produits (avec catégorie & options). */
export async function getAdminMenuData() {
  const [categories, dishes] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      distinct: ["slug"],
    }),
    prisma.dish.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      distinct: ["slug"],
      include: {
        category: true,
        optionGroups: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
  ]);
  return { categories, dishes };
}

export interface MenuDish extends Dish {
  available: boolean;
  hasOptions: boolean;
  /** Unités restantes aujourd'hui (null = illimité). */
  remaining: number | null;
  /** Stock limité tombé à zéro. */
  soldOut: boolean;
}
export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  dishes: MenuDish[];
}

/** Menu public structuré par catégories (produits disponibles ou épuisés). */
export async function getMenu(): Promise<MenuCategory[]> {
  const categories = await prisma.category.findMany({
    where: { slug: { in: publicMenuCategorySlugs } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    distinct: ["slug"],
    include: {
      dishes: {
        where: { slug: { in: publicMenuDishSlugs } },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        distinct: ["slug"],
        include: { _count: { select: { optionGroups: true } } },
      },
    },
  });
  return categories
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      dishes: c.dishes.map((d) => ({
        ...toDish(d),
        available: d.available,
        hasOptions: d._count.optionGroups > 0,
        remaining: remainingStock(d),
        soldOut: isSoldOut(d),
      })),
    }))
    .filter((c) => c.dishes.length > 0);
}

/** Données du menu pour le browser interactif : catégories + produits à plat. */
export async function getMenuForBrowser() {
  const categories = await prisma.category.findMany({
    where: { slug: { in: publicMenuCategorySlugs } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    distinct: ["slug"],
  });
  const categoryIds = categories.map((c) => c.id);

  const rows = await prisma.dish.findMany({
    where: {
      slug: { in: publicMenuDishSlugs },
      categoryId: { in: categoryIds },
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    distinct: ["slug"],
    include: { _count: { select: { optionGroups: true } } },
  });

  return {
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
    })),
    dishes: rows
      .filter((d) => d.categoryId)
      .map((d) => ({
        ...toDish(d),
        available: d.available,
        hasOptions: d._count.optionGroups > 0,
        remaining: remainingStock(d),
        soldOut: isSoldOut(d),
        categoryId: d.categoryId as string,
      })),
  };
}

/** Fiche produit complète avec ses groupes d'options (pour la page détail). */
export async function getDishWithOptions(slug: string) {
  if (!publicMenuDishSlugs.includes(slug)) return null;

  const dish = await prisma.dish.findFirst({
    where: {
      slug,
      category: { is: { slug: { in: publicMenuCategorySlugs } } },
    },
    orderBy: { id: "asc" },
    include: {
      category: true,
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  return dish
    ? {
        ...withDishPresentation(dish),
        remaining: remainingStock(dish),
        soldOut: isSoldOut(dish),
      }
    : null;
}
