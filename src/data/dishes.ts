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
    slug: "adana-kebab",
    name: "Adana kebab",
    description:
      "Brochette de viande hachée d'agneau épicée, grillée au charbon, bulgur et salade",
    price: 14.9,
    image: "/images/africain/yassa-poulet.webp",
    category: "grillades",
    tag: "Signature",
    sortOrder: 1,
  },
  {
    slug: "iskender-kebab",
    name: "İskender kebab",
    description:
      "Émincé de viande grillée sur pide, sauce tomate, beurre noisette et yaourt",
    price: 16.9,
    image: "/images/africain/thiep-poisson.webp",
    category: "grillades",
    tag: "Populaire",
    sortOrder: 2,
  },
  {
    slug: "kebab-grille",
    name: "Kebab grillé",
    description:
      "Viande marinée grillée au charbon, riz pilaf et légumes grillés",
    price: 13.9,
    image: "/images/africain/thiep-poulet.webp",
    category: "grillades",
    sortOrder: 3,
  },
  {
    slug: "hamburger-maison",
    name: "Hamburger maison",
    description:
      "Steak de bœuf grillé, cheddar fondant, salade, tomate, oignon rouge et sauce maison",
    price: 12.9,
    image: "/images/africain/thiep-poulet.webp",
    category: "grillades",
    tag: "Nouveau",
    sortOrder: 5,
  },
  {
    slug: "tacos-maison",
    name: "Tacos maison",
    description:
      "Viande grillée, frites, cheddar fondant et sauce fromagère dans une tortilla toastée",
    price: 11.9,
    image: "/images/africain/attieke-poisson-alloco.webp",
    category: "grillades",
    tag: "Nouveau",
    sortOrder: 6,
  },
  {
    slug: "lahmacun",
    name: "Lahmacun",
    description:
      "Pâte fine croustillante garnie de viande hachée, tomate, poivron et persil",
    price: 6.9,
    image: "/images/africain/attieke-poisson-alloco.webp",
    category: "pide",
    tag: "Maison",
    sortOrder: 4,
  },
  {
    slug: "pide-sucuk",
    name: "Pide sucuk",
    description:
      "Barque de pâte dorée garnie de sucuk épicé, fromage fondant et œuf",
    price: 9.9,
    image: "/images/africain/pastels-alloco.webp",
    category: "pide",
    sortOrder: 5,
  },
  {
    slug: "manti",
    name: "Mantı",
    description:
      "Raviolis turcs farcis à la viande, yaourt à l'ail et beurre au paprika",
    price: 12.9,
    image: "/images/africain/mafe-boeuf.webp",
    category: "specialites",
    tag: "Spécialité",
    sortOrder: 6,
  },
  {
    slug: "baklava",
    name: "Baklava",
    description: "Feuilles de pâte filo, pistaches concassées et sirop de miel",
    price: 5.9,
    image: "/images/africain/desserts-africains.webp",
    category: "desserts",
    tag: "Incontournable",
    sortOrder: 7,
  },
  {
    slug: "ayran",
    name: "Ayran",
    description:
      "Boisson traditionnelle au yaourt battu, fraîche et légèrement salée",
    price: 2.5,
    image: "/images/africain/boissons-bissap-gingembre-bouye.webp",
    category: "boissons",
    sortOrder: 8,
  },
];
