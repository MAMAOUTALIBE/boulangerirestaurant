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
    image: "/images/chez-mine/assiette-brochettes-kofta.jpg",
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
    image: "/images/chez-mine/assiette-doner.jpg",
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
    image: "/images/chez-mine/assiette-mixte.jpg",
    category: "grillades",
    sortOrder: 3,
  },
  {
    slug: "hamburger-maison",
    name: "Hamburger maison",
    description:
      "Steak de bœuf grillé, cheddar fondant, salade, tomate, oignon rouge et sauce maison",
    price: 12.9,
    image: "/images/chez-mine/cheeseburger.jpg",
    category: "sandwichs",
    tag: "Nouveau",
    sortOrder: 1,
  },
  {
    slug: "double-cheeseburger",
    name: "Double cheeseburger",
    description:
      "Deux steaks de bœuf grillés, double cheddar, salade, oignons et sauce maison, servi avec frites",
    price: 14.9,
    image: "/images/chez-mine/double-cheeseburger.jpg",
    category: "sandwichs",
    tag: "Généreux",
    sortOrder: 2,
  },
  {
    slug: "sandwich-doner-poulet",
    name: "Sandwich döner poulet",
    description:
      "Pain maison, émincé de poulet grillé, salade, tomate, oignons et sauce au choix, servi avec frites",
    price: 10.9,
    image: "/images/chez-mine/sandwich-doner-poulet.jpg",
    category: "sandwichs",
    tag: "Populaire",
    sortOrder: 3,
  },
  {
    slug: "sandwich-kofte",
    name: "Sandwich köfte",
    description:
      "Pain maison, köfte grillées, salade, tomate, oignons et sauce au choix, servi avec frites",
    price: 11.5,
    image: "/images/chez-mine/sandwich-kofte.jpg",
    category: "sandwichs",
    sortOrder: 4,
  },
  {
    slug: "sandwich-steak",
    name: "Sandwich steak cheddar",
    description:
      "Pain maison, steaks grillés, cheddar, salade, tomate et oignons, servi avec frites",
    price: 11.9,
    image: "/images/chez-mine/sandwich-steak.jpg",
    category: "sandwichs",
    sortOrder: 5,
  },
  {
    slug: "sandwich-poulet-marine",
    name: "Sandwich poulet mariné",
    description:
      "Pain maison, morceaux de poulet marinés et grillés, crudités et sauce au choix, servi avec frites",
    price: 10.9,
    image: "/images/chez-mine/sandwich-poulet-marine.jpg",
    category: "sandwichs",
    sortOrder: 6,
  },
  {
    slug: "tacos-maison",
    name: "Tacos poulet",
    description:
      "Poulet mariné, frites, cheddar et sauce fromagère dans une tortilla grillée",
    price: 11.9,
    image: "/images/chez-mine/sandwich-poulet-epice.jpg",
    category: "sandwichs",
    sortOrder: 7,
  },
  {
    slug: "assiette-brochettes-poulet",
    name: "Assiette brochettes de poulet",
    description:
      "Deux brochettes de poulet grillé, riz, boulgour, salade et sauces maison",
    price: 15.9,
    image: "/images/chez-mine/assiette-brochettes-poulet.jpg",
    category: "grillades",
    tag: "Grillé minute",
    sortOrder: 4,
  },
  {
    slug: "assiette-cotelettes-agneau",
    name: "Assiette côtelettes d'agneau",
    description:
      "Côtelettes d'agneau grillées, riz, boulgour, salade et sauces maison",
    price: 18.9,
    image: "/images/chez-mine/assiette-cotelettes-agneau.jpg",
    category: "grillades",
    tag: "Grillades",
    sortOrder: 5,
  },
  {
    slug: "assiette-doner-poulet",
    name: "Assiette döner poulet",
    description:
      "Émincé de poulet döner, riz, boulgour, salade et sauces maison",
    price: 14.9,
    image: "/images/chez-mine/assiette-doner-poulet.jpg",
    category: "grillades",
    sortOrder: 6,
  },
  {
    slug: "saute-veau",
    name: "Sauté de veau",
    description:
      "Veau mijoté aux légumes et aux épices, servi avec boulgour et salade",
    price: 15.9,
    image: "/images/chez-mine/saute-veau.jpg",
    category: "specialites",
    tag: "Plat du jour",
    sortOrder: 7,
  },
  {
    slug: "lahmacun",
    name: "Lahmacun",
    description:
      "Pâte fine croustillante garnie de viande hachée, tomate, poivron et persil",
    price: 6.9,
    image: "/images/galerie/lahmacun-maison.webp",
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
    image: "/images/hero-slide-pide-lahmacun.png",
    category: "pide",
    sortOrder: 5,
  },
  {
    slug: "manti",
    name: "Mantı",
    description:
      "Raviolis turcs farcis à la viande, yaourt à l'ail et beurre au paprika",
    price: 12.9,
    image: "/images/about-3.jpg",
    category: "specialites",
    tag: "Spécialité",
    sortOrder: 6,
  },
  {
    slug: "baklava",
    name: "Baklava",
    description: "Feuilles de pâte filo, pistaches concassées et sirop de miel",
    price: 5.9,
    image: "/images/chez-mine/baklava-maison.jpg",
    category: "desserts",
    tag: "Incontournable",
    sortOrder: 7,
  },
  {
    slug: "revani",
    name: "Revani",
    description:
      "Gâteau turc moelleux à la semoule, imbibé de sirop et parsemé de noix de coco",
    price: 4.9,
    image: "/images/chez-mine/revani.jpg",
    category: "desserts",
    tag: "Maison",
    sortOrder: 8,
  },
  {
    slug: "ayran",
    name: "Ayran",
    description:
      "Boisson traditionnelle au yaourt battu, fraîche et légèrement salée",
    price: 2.5,
    image: "/images/ayran.png",
    category: "boissons",
    sortOrder: 9,
  },
];
