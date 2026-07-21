/**
 * Profil de seed « anatolia-grill » — restaurant turc de DÉMONSTRATION.
 *
 * C'est le profil par défaut (dev). Il conserve le comportement historique du
 * seed : contenu turc complet + fixtures de démo + `resetStrategy: "demo"`
 * (désactive les autres restaurants / plats / promos).
 *
 * Pour provisionner un VRAI restaurant, créer un nouveau profil (copier
 * `blank.ts`) avec `resetStrategy: "additive"` plutôt que de partir de celui-ci.
 */
import { seedDishes } from "../../src/data/dishes";
import type { SeedDish, SeedProfile } from "./types";

const categories = [
  { slug: "entrees", name: "Entrées & Mezze", sortOrder: 1 },
  { slug: "grillades", name: "Grillades & Kebabs", sortOrder: 2 },
  { slug: "pide", name: "Pide & Lahmacun", sortOrder: 3 },
  { slug: "specialites", name: "Spécialités", sortOrder: 4 },
  { slug: "desserts", name: "Desserts", sortOrder: 5 },
  { slug: "boissons", name: "Boissons", sortOrder: 6 },
];

const extraDishes: SeedDish[] = [
  {
    slug: "mercimek-corbasi",
    name: "Mercimek çorbası",
    description: "Soupe crémeuse de lentilles corail, cumin et filet de citron",
    price: 5.5,
    image: "/images/galerie/soupe-lentilles.webp",
    category: "entrees",
    sortOrder: 1,
  },
  {
    slug: "houmous",
    name: "Houmous maison",
    description:
      "Purée de pois chiches au tahini, citron et huile d'olive, servie avec du pide chaud",
    price: 6.5,
    image: "/images/about-3.jpg",
    category: "entrees",
    sortOrder: 2,
  },
  {
    slug: "borek-fromage",
    name: "Börek au fromage",
    description:
      "Feuilles de yufka croustillantes garnies de fromage et de persil",
    price: 6.9,
    image: "/images/hero-slide-pide-lahmacun.png",
    category: "entrees",
    sortOrder: 3,
  },
  {
    slug: "kofte",
    name: "Köfte",
    description: "Boulettes de viande grillées aux épices, riz pilaf et salade",
    price: 13.5,
    image: "/images/galerie/boeuf-mijote-boulgour.webp",
    category: "grillades",
    sortOrder: 4,
  },
  {
    slug: "sutlac",
    name: "Sütlaç",
    description:
      "Riz au lait turc parfumé à la vanille, légèrement gratiné au four",
    price: 4.9,
    image: "/images/hero-slide-desserts-turcs.png",
    category: "desserts",
    sortOrder: 5,
  },
  {
    slug: "the-turc",
    name: "Thé turc (çay)",
    description: "Thé noir infusé, servi dans le verre tulipe traditionnel",
    price: 2.0,
    image: "/images/hero-slide-boissons-turques.png",
    category: "boissons",
    sortOrder: 6,
  },
  {
    slug: "sodas-frais",
    name: "Sodas",
    description: "Canettes 33 cl au choix, bien fraîches",
    price: 2.5,
    image: "/images/boisson-sodas.png",
    category: "boissons",
    sortOrder: 7,
  },
];

const anatoliaGrill: SeedProfile = {
  restaurant: { slug: "anatolia-grill", name: "Restaurant" },
  resetStrategy: "demo",
  // Identité laissée vide : retombe sur `defaultSiteConfig` (src/lib/config.ts),
  // surchargeable ensuite depuis /admin/parametres.
  ordering: { slotIntervalMin: 15, leadTimeMin: 20, capacityPerSlot: 8 },
  categories,
  dishes: [...seedDishes, ...extraDishes],
  optionGroups: [
    {
      dishSlug: "kebab-grille",
      name: "Accompagnement",
      type: "single",
      required: true,
      sortOrder: 1,
      options: [
        { name: "Riz pilaf", priceDelta: 0, sortOrder: 1 },
        { name: "Bulgur", priceDelta: 0, sortOrder: 2 },
        { name: "Frites maison", priceDelta: 1, sortOrder: 3 },
        { name: "Salade", priceDelta: 0, sortOrder: 4 },
      ],
    },
    {
      dishSlug: "kebab-grille",
      name: "Sauces & suppléments",
      type: "multi",
      required: false,
      sortOrder: 2,
      options: [
        { name: "Sauce blanche", priceDelta: 0.5, sortOrder: 1 },
        { name: "Sauce piquante", priceDelta: 0.5, sortOrder: 2 },
        { name: "Fromage", priceDelta: 1.5, sortOrder: 3 },
        { name: "Boisson 33 cl", priceDelta: 2, sortOrder: 4 },
      ],
    },
  ],
  deliveryZones: [
    { postalCode: "91260", fee: 3.5, minOrder: 15 },
    { postalCode: "91200", fee: 4.5, minOrder: 20 },
    { postalCode: "91600", fee: 4, minOrder: 18 },
  ],
  openingHours: Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    openMinutes: 11 * 60 + 30,
    closeMinutes: 23 * 60,
  })),
  promoCodes: [
    { code: "BIENVENUE10", type: "percent", value: 10, active: true },
  ],
  demo: {
    stock: {
      "adana-kebab": 20,
      "iskender-kebab": 15,
      lahmacun: 30,
      baklava: 24,
    },
    seasonal: {
      slug: "plateau-baklava",
      name: "Plateau de baklava assorti",
      description:
        "Assortiment de baklava pistache et noix, fait maison. En précommande, quantités limitées.",
      image: "/images/hero-slide-desserts-turcs.png",
      price: 24.9,
      quota: 50,
      salesStartOffsetDays: -5,
      salesEndOffsetDays: 30,
      pickupStartOffsetDays: 2,
      pickupEndOffsetDays: 30,
    },
    antiwaste: {
      title: "Plateau surprise du soir",
      description:
        "Assortiment de spécialités du jour : grillades, pide, mezze et accompagnements.",
      price: 8,
      originalValue: 22,
      quantity: 8,
      pickupStart: "18:00",
      pickupEnd: "19:30",
    },
  },
};

export default anatoliaGrill;
