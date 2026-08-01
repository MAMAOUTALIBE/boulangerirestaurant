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
      "Pastels croustillants farcis, vendus à la pièce et servis avec une sauce maison",
    price: 1,
    image: "/images/africain/29_pastels.webp",
    category: "entrees",
    tag: "Maison",
    sortOrder: 1,
  },
  {
    slug: "alloco",
    name: "Bananes plantain",
    description:
      "Bananes plantain mûres frites, dorées et fondantes, servies avec sauce maison",
    price: 5,
    image: "/images/africain/21_bananes-plantain.webp",
    category: "entrees",
    sortOrder: 2,
  },
  {
    slug: "attieke-legumes",
    name: "Attiéké légumes",
    description: "Semoule de manioc accompagnée de légumes frais assaisonnés",
    price: 5,
    image: "/images/africain/20_attieke-legumes.webp",
    category: "entrees",
    sortOrder: 3,
  },
  {
    slug: "patate-douce",
    name: "Patate douce",
    description:
      "Patates douces fondantes et dorées, servies en accompagnement",
    price: 5,
    image: "/images/africain/30_patate-douce.webp",
    category: "entrees",
    sortOrder: 4,
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
    name: "Tiebe poulet aux légumes",
    description:
      "Riz rouge savoureux, poulet mariné et légumes mijotés aux épices",
    price: 5,
    image: "/images/africain/36_thieb-poulet-legumes.webp",
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
    slug: "poisson-tubercules-sauce",
    name: "Poisson, tubercules & sauce",
    description:
      "Poisson frit, tubercules dorés, oignons marinés et sauce tomate maison",
    price: 5,
    image: "/images/africain/15_poisson_igname_sauce.webp",
    category: "plats-africains",
    sortOrder: 5,
  },
  {
    slug: "haricots-poulet",
    name: "Haricots au poulet et aux légumes",
    description: "Haricots mijotés servis avec poulet, légumes et sauce maison",
    price: 5,
    image: "/images/africain/28_haricots-poulet-legumes.webp",
    category: "plats-africains",
    sortOrder: 6,
  },
  {
    slug: "mafe-poulet",
    name: "Mafé au poulet",
    description:
      "Poulet mijoté dans une sauce onctueuse à l'arachide, servi avec du riz blanc",
    price: 5,
    image: "/images/africain/03_mafe_au_poulet.webp",
    category: "plats-africains",
    sortOrder: 7,
  },
  {
    slug: "sauce-mafe-riz",
    name: "Sauce mafé & riz blanc",
    description: "Sauce mafé onctueuse à l'arachide accompagnée de riz blanc",
    price: 5,
    image: "/images/africain/32_sauce-mafe-riz.webp",
    category: "plats-africains",
    sortOrder: 10,
  },
  {
    slug: "sauce-tomate-riz",
    name: "Sauce tomate & riz blanc",
    description: "Sauce tomate mijotée accompagnée de riz blanc",
    price: 5,
    image: "/images/africain/33_sauce-tomate-riz.webp",
    category: "plats-africains",
    sortOrder: 11,
  },
  {
    slug: "sauce-epinards-riz",
    name: "Sauce épinards & riz blanc",
    description: "Sauce aux épinards mijotés accompagnée de riz blanc",
    price: 5,
    image: "/images/africain/31_sauce-epinards-riz.webp",
    category: "plats-africains",
    sortOrder: 12,
  },
  {
    slug: "sauce-yassa-riz",
    name: "Sauce yassa & riz blanc",
    description: "Sauce yassa aux oignons confits accompagnée de riz blanc",
    price: 5,
    image: "/images/africain/34_sauce-yassa-riz.webp",
    category: "plats-africains",
    sortOrder: 13,
  },
  {
    slug: "djouka-fonio",
    name: "Djouka",
    description: "Fonio traditionnel préparé maison et délicatement assaisonné",
    price: 5,
    image: "/images/africain/27_djouka-fonio.webp",
    category: "plats-africains",
    sortOrder: 14,
  },
  {
    slug: "poisson-alloko",
    name: "Poisson & alloko",
    description:
      "Poisson frit accompagné de bananes plantain alloko et sauce maison",
    price: 5,
    image: "/images/africain/04_poisson_alloko.webp",
    category: "grillades",
    sortOrder: 3,
  },
  {
    slug: "poisson-grille-crudites",
    name: "Poisson grillé & crudités",
    description:
      "Poisson grillé servi avec des crudités fraîches et une sauce maison",
    price: 5,
    image: "/images/africain/05_poisson_grille_crudites.webp",
    category: "grillades",
    sortOrder: 4,
  },
  {
    slug: "poisson-oignons",
    name: "Poisson aux oignons",
    description:
      "Poisson entier frit garni d'oignons marinés et accompagné de piment",
    price: 5,
    image: "/images/africain/06_poisson_aux_oignons.webp",
    category: "grillades",
    sortOrder: 5,
  },
  {
    slug: "boeuf-grille",
    name: "Viande de bœuf grillée",
    description: "Viande de bœuf assaisonnée puis grillée",
    price: 5,
    image: "/images/africain/22_boeuf-grille.webp",
    category: "grillades",
    sortOrder: 6,
  },
  {
    slug: "soupe-boeuf-mijotee",
    name: "Soupe de viande de bœuf mijotée",
    description: "Viande de bœuf longuement mijotée dans un bouillon parfumé",
    price: 5,
    image: "/images/africain/35_soupe-boeuf-mijotee.webp",
    category: "grillades",
    sortOrder: 7,
  },
  {
    slug: "tilapia",
    name: "Tilapia",
    description: "Tilapia entier assaisonné et préparé maison",
    price: 6,
    image: "/images/africain/37_tilapia.webp",
    category: "grillades",
    sortOrder: 8,
  },
  {
    slug: "capitaine-entier",
    name: "Capitaine entier",
    description: "Poisson capitaine entier assaisonné et préparé maison",
    price: 12,
    image: "/images/africain/24_capitaine-entier.webp",
    category: "grillades",
    sortOrder: 9,
  },
  {
    slug: "demi-capitaine",
    name: "Capitaine moitié",
    description: "Demi-poisson capitaine assaisonné et préparé maison",
    price: 6,
    image: "/images/africain/26_demi-capitaine.webp",
    category: "grillades",
    sortOrder: 10,
  },
  {
    slug: "cuisse-poulet",
    name: "Cuisse de poulet",
    description: "Cuisse de poulet assaisonnée, vendue à la pièce",
    price: 2.5,
    image: "/images/africain/25_cuisse-poulet.webp",
    category: "grillades",
    sortOrder: 11,
  },
  {
    slug: "brochettes-boeuf-poulet",
    name: "Brochette bœuf ou poulet",
    description: "Brochette de bœuf ou de poulet, vendue à la pièce",
    price: 1.5,
    image: "/images/africain/23_brochettes-boeuf-poulet.webp",
    category: "grillades",
    sortOrder: 12,
  },
  {
    slug: "riz-rouge-poulet",
    name: "Riz rouge au poulet",
    description:
      "Riz rouge parfumé servi avec poulet mariné et légumes mijotés",
    price: 5,
    image: "/images/africain/12_riz_rouge_poulet_2026.webp",
    category: "plats-africains",
    sortOrder: 8,
  },
  {
    slug: "riz-poulet-legumes",
    name: "Riz au poulet & légumes",
    description:
      "Riz rouge parfumé, poulet rôti et légumes mijotés dans une sauce maison",
    price: 5,
    image: "/images/africain/13_riz_poulet_legumes.webp",
    category: "plats-africains",
    sortOrder: 9,
  },
  {
    slug: "menu-poisson-alloko",
    name: "Menu poisson & alloko",
    description: "Poisson aux oignons, alloko, dégué et boisson maison",
    price: 5,
    image: "/images/africain/17_menu_alloko_poisson.webp",
    category: "menus-complets",
    sortOrder: 1,
  },
  {
    slug: "menu-poisson-alloko-degue-orange",
    name: "Menu poisson complet",
    description: "Poisson aux oignons, alloko, dégué et jus d'orange",
    price: 5,
    image: "/images/africain/14_menu_grillades_alloko_degue_jus.webp",
    category: "menus-complets",
    sortOrder: 2,
  },
  {
    slug: "menu-mafe-degue-orange",
    name: "Menu mafé complet",
    description: "Mafé, riz blanc, alloko, dégué et jus d'orange",
    price: 5,
    image: "/images/africain/18_menu_mafe.webp",
    category: "menus-complets",
    sortOrder: 3,
  },
  {
    slug: "menu-riz-rouge-poulet-alloko",
    name: "Menu riz rouge complet",
    description: "Riz rouge au poulet, légumes, alloko, dégué et bissap",
    price: 5,
    image: "/images/africain/19_menu_riz_gras_rouge.webp",
    category: "menus-complets",
    sortOrder: 4,
  },
  {
    slug: "formule-riz-poulet-alloko",
    name: "Formule riz, poulet & alloko",
    description:
      "Riz rouge au poulet, légumes, alloko, dégué et boisson maison",
    price: 5,
    image: "/images/africain/16_formule_riz_poulet_alloko.webp",
    category: "menus-complets",
    sortOrder: 5,
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
