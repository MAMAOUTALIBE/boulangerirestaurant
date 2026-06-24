/**
 * Données de référence des produits (seed initial de la base).
 * La source de vérité en production est la table `Dish` (éditable via le CRM).
 * Voir `prisma/seed.ts` et `src/lib/dishes.ts`.
 */
export interface SeedDish {
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  tag?: string;
  sortOrder: number;
}

export const seedDishes: SeedDish[] = [
  {
    slug: "baguette-tradition",
    name: "Baguette tradition",
    description: "Farine française, fermentation lente et croûte croustillante",
    price: 1.4,
    image: "/images/menu/baguette-tradition.webp",
    category: "pains",
    tag: "Signature",
    sortOrder: 1,
  },
  {
    slug: "pain-levain",
    name: "Pain au levain",
    description: "Miche artisanale au levain naturel, mie alvéolée",
    price: 5.2,
    image: "/images/menu/pain-levain.webp",
    category: "pains",
    tag: "Maison",
    sortOrder: 2,
  },
  {
    slug: "croissant-beurre",
    name: "Croissant pur beurre",
    description: "Feuilletage maison, beurre AOP et cuisson du matin",
    price: 1.6,
    image: "/images/menu/croissant-beurre.webp",
    category: "viennoiseries",
    tag: "Populaire",
    sortOrder: 3,
  },
  {
    slug: "pain-chocolat",
    name: "Pain au chocolat",
    description: "Pâte levée feuilletée et deux barres de chocolat noir",
    price: 1.8,
    image: "/images/menu/pain-chocolat.webp",
    category: "viennoiseries",
    sortOrder: 4,
  },
  {
    slug: "tartelette-fruits",
    name: "Tartelette aux fruits",
    description: "Pâte sucrée, crème légère et fruits de saison",
    price: 4.9,
    image: "/images/menu/tartelette-fruits.webp",
    category: "patisseries",
    tag: "Saison",
    sortOrder: 5,
  },
  {
    slug: "eclair-chocolat",
    name: "Éclair chocolat",
    description: "Pâte à choux, crème chocolat et glaçage noir",
    price: 4.2,
    image: "/images/menu/eclair-chocolat.webp",
    category: "patisseries",
    sortOrder: 3,
  },
  {
    slug: "sandwich-baguette-poulet",
    name: "Sandwich baguette poulet",
    description: "Baguette tradition, poulet rôti, crudités et sauce maison",
    price: 6.9,
    image: "/images/menu/sandwich-baguette-poulet.webp",
    category: "snacking",
    tag: "Déjeuner",
    sortOrder: 6,
  },
  {
    slug: "quiche-lorraine",
    name: "Quiche lorraine",
    description: "Appareil crémeux, lardons fumés et pâte brisée maison",
    price: 5.8,
    image: "/images/menu/quiche-lorraine.webp",
    category: "snacking",
    sortOrder: 7,
  },
];
