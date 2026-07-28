import "server-only";
import type { Dish as DishRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Dish } from "@/types";
import { remainingStock, isSoldOut } from "@/lib/stock";

// La visibilité publique d'un produit/catégorie est désormais pilotée par le
// CRM (champ `available`), et non plus par une liste blanche de slugs figée :
// tout produit actif créé/édité depuis /admin/menu apparaît côté public.
//
// L'image l'est aussi : `Dish.image` (choisi dans la médiathèque depuis
// /admin/menu) est la seule source de vérité. La table `dishImageOverrides` qui
// forçait la photo de certains slugs a été supprimée — elle rendait le champ du
// CRM sans effet. Ses valeurs ont été recopiées en base par la migration
// `20260728103100_dish_image_from_crm`.

/** Convertit une ligne Prisma en `Dish` applicatif (id = slug, stable). */
function toDish(row: DishRow): Dish {
  return {
    id: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image,
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
  /** Mis en avant depuis /admin/menu (accueil + badge « Populaire »). */
  featured: boolean;
}
export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  /** Accroche éditable au CRM (facultative). */
  description: string | null;
  /** Bannière éditable au CRM (facultative). */
  image: string | null;
  dishes: MenuDish[];
}

/** Présentation publique d'un plat (champs communs à toutes les vues carte). */
function toMenuDish(
  row: DishRow & { _count: { optionGroups: number } },
): MenuDish {
  return {
    ...toDish(row),
    available: row.available,
    hasOptions: row._count.optionGroups > 0,
    remaining: remainingStock(row),
    soldOut: isSoldOut(row),
    featured: row.featured,
  };
}

/** Menu public structuré par catégories (produits disponibles ou épuisés). */
export async function getMenu(): Promise<MenuCategory[]> {
  const categories = await prisma.category.findMany({
    where: { active: true },
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
      description: c.description,
      image: c.image,
      dishes: c.dishes.map(toMenuDish),
    }))
    .filter((c) => c.dishes.length > 0);
}

/** Données du menu pour le browser interactif : catégories + produits à plat. */
export async function getMenuForBrowser() {
  const categories = await prisma.category.findMany({
    where: { active: true },
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

  // N'expose que les catégories ayant au moins un produit disponible
  // (évite d'afficher d'anciennes catégories vides comme onglets de filtre).
  const usedCategoryIds = new Set(
    rows.map((d) => d.categoryId).filter((id): id is string => Boolean(id)),
  );

  return {
    categories: categories
      .filter((c) => usedCategoryIds.has(c.id))
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        image: c.image,
      })),
    dishes: rows
      .filter((d) => d.categoryId)
      .map((d) => ({
        ...toMenuDish(d),
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
        ...dish,
        remaining: remainingStock(dish),
        soldOut: isSoldOut(dish),
      }
    : null;
}
