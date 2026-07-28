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
  /** Mis en avant : spécialités de l'accueil + badge « Populaire ». */
  featured?: boolean;
}

export const seedDishes: SeedDish[] = [
  {
    slug: "pastels-maison",
    name: "Pastels maison",
    description:
      "Beignets croustillants farcis au poisson, servis avec notre sauce tomate relevée",
    price: 6.9,
    image: "/images/africain/pastels-alloco.webp",
    category: "entrees",
    tag: "Maison",
    sortOrder: 1,
  },
  {
    slug: "alloco",
    name: "Alloco",
    description:
      "Bananes plantain mûres frites, dorées et fondantes, servies avec sauce maison",
    price: 5.9,
    image: "/images/africain/pastels-alloco.webp",
    category: "entrees",
    sortOrder: 2,
  },
  {
    slug: "thieb-poisson",
    featured: true,
    name: "Thiéboudiène poisson",
    description:
      "Riz parfumé à la tomate, poisson mariné et légumes mijotés selon la tradition",
    price: 16.9,
    image: "/images/africain/thiep-poisson.webp",
    category: "plats-africains",
    tag: "Signature",
    sortOrder: 1,
  },
  {
    slug: "thieb-poulet",
    name: "Thiéboudiène poulet",
    description:
      "Riz rouge savoureux, poulet mariné et légumes mijotés aux épices",
    price: 14.9,
    image: "/images/africain/thiep-poulet.webp",
    category: "plats-africains",
    tag: "Populaire",
    sortOrder: 2,
  },
  {
    slug: "yassa-poulet",
    featured: true,
    name: "Yassa poulet",
    description:
      "Poulet mariné au citron, oignons doucement confits et riz parfumé",
    price: 14.9,
    image: "/images/africain/yassa-poulet.webp",
    category: "plats-africains",
    tag: "Incontournable",
    sortOrder: 3,
  },
  {
    slug: "mafe-boeuf",
    featured: true,
    name: "Mafé bœuf",
    description:
      "Bœuf mijoté dans une sauce onctueuse à l'arachide, servi avec du riz",
    price: 15.9,
    image: "/images/africain/mafe-boeuf.webp",
    category: "plats-africains",
    tag: "Généreux",
    sortOrder: 4,
  },
  {
    slug: "attieke-poisson-alloco",
    featured: true,
    name: "Attiéké poisson & alloco",
    description:
      "Poisson grillé, semoule de manioc, bananes plantain et crudités fraîches",
    price: 16.9,
    image: "/images/africain/attieke-poisson-alloco.webp",
    category: "grillades",
    tag: "Grillé minute",
    sortOrder: 1,
  },
  {
    slug: "poulet-braise-alloco",
    name: "Poulet braisé & alloco",
    description:
      "Poulet mariné et braisé, bananes plantain dorées, crudités et sauce maison",
    price: 15.9,
    image: "/images/africain/thiep-poulet.webp",
    category: "grillades",
    sortOrder: 2,
  },
  {
    slug: "douceur-africaine",
    name: "Douceur africaine",
    description:
      "Dessert du jour aux saveurs d'Afrique, préparé maison selon l'inspiration",
    price: 5.9,
    image: "/images/africain/desserts-africains.webp",
    category: "desserts",
    tag: "Maison",
    sortOrder: 1,
  },
  {
    slug: "bissap-maison",
    name: "Bissap maison",
    description:
      "Infusion fraîche de fleurs d'hibiscus, délicatement sucrée et parfumée",
    price: 3.5,
    image: "/images/africain/boissons-bissap-gingembre-bouye.webp",
    category: "boissons",
    tag: "Maison",
    sortOrder: 1,
  },
  {
    slug: "jus-gingembre",
    name: "Jus de gingembre",
    description:
      "Boisson maison au gingembre frais, tonique et légèrement citronnée",
    price: 3.5,
    image: "/images/africain/boissons-bissap-gingembre-bouye.webp",
    category: "boissons",
    sortOrder: 2,
  },
  {
    slug: "jus-bouye",
    name: "Jus de bouye",
    description:
      "Boisson crémeuse au fruit du baobab, douce et rafraîchissante",
    price: 4,
    image: "/images/africain/boissons-bissap-gingembre-bouye.webp",
    category: "boissons",
    sortOrder: 3,
  },
];
