import "server-only";
import type { Dish as DishRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Dish } from "@/types";
import { remainingStock, isSoldOut } from "@/lib/stock";

const dishImageOverrides: Record<string, string> = {
  "baguette-tradition": "/images/menu/baguette-tradition.webp",
  "brioche-tressee": "/images/menu/brioche-tressee.webp",
  "cafe-allonge": "/images/menu/cafe-allonge.webp",
  "chausson-pommes": "/images/menu/chausson-pommes.webp",
  "chocolat-chaud": "/images/menu/chocolat-chaud.webp",
  "croissant-beurre": "/images/menu/croissant-beurre.webp",
  "eclair-chocolat": "/images/menu/eclair-chocolat.webp",
  "flan-patissier": "/images/menu/flan-patissier.webp",
  "jus-orange-presse": "/images/menu/jus-orange-presse.webp",
  "pain-chocolat": "/images/menu/pain-chocolat.webp",
  "pain-complet-graines": "/images/menu/pain-complet-graines.webp",
  "pain-levain": "/images/menu/pain-levain.webp",
  "paris-brest": "/images/menu/paris-brest.webp",
  "quiche-lorraine": "/images/menu/quiche-lorraine.webp",
  "sandwich-baguette-poulet": "/images/menu/sandwich-baguette-poulet.webp",
  "tartelette-fruits": "/images/menu/tartelette-fruits.webp",
};

// La visibilité publique d'un produit/catégorie est désormais pilotée par le
// CRM (champ `available`), et non plus par une liste blanche de slugs figée :
// tout produit actif créé/édité depuis /admin/menu apparaît côté public.

/**
 * Image affichée : les produits éditoriaux connus ont une photo dédiée pour
 * éviter les inversions visuelles ; les produits créés au CRM gardent leur image.
 */
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
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    distinct: ["slug"],
    include: {
      dishes: {
        where: { available: true },
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
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    distinct: ["slug"],
  });
  const categoryIds = categories.map((c) => c.id);

  const rows = await prisma.dish.findMany({
    where: {
      available: true,
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
  const dish = await prisma.dish.findFirst({
    where: {
      slug,
      available: true,
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
