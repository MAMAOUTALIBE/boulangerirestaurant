/**
 * Profil de démonstration de Lawale Simbo.
 *
 * Ce profil conserve le slug technique historique `anatolia-grill` pour ne pas
 * casser le déploiement existant. Il reste destructif et réservé au développement.
 */
import { seedDishes } from "../../src/data/dishes";
import type { SeedProfile } from "./types";

const lauualeSimbo: SeedProfile = {
  restaurant: { slug: "anatolia-grill", name: "Lawale Simbo" },
  resetStrategy: "demo",
  ordering: { slotIntervalMin: 15, leadTimeMin: 25, capacityPerSlot: 8 },
  categories: [
    { slug: "entrees", name: "Entrées & accompagnements", sortOrder: 1 },
    { slug: "plats-africains", name: "Plats africains", sortOrder: 2 },
    { slug: "grillades", name: "Grillades", sortOrder: 3 },
    { slug: "menus-complets", name: "Menus complets", sortOrder: 4 },
    { slug: "desserts", name: "Desserts", sortOrder: 5 },
    { slug: "boissons", name: "Boissons maison", sortOrder: 6 },
  ],
  dishes: seedDishes,
  optionGroups: [
    {
      dishSlug: "attieke-poisson-alloco",
      name: "Accompagnement supplémentaire",
      type: "single",
      required: false,
      sortOrder: 1,
      options: [
        { name: "Alloco", priceDelta: 3, sortOrder: 1 },
        { name: "Attiéké", priceDelta: 3, sortOrder: 2 },
        { name: "Riz", priceDelta: 2.5, sortOrder: 3 },
      ],
    },
    {
      dishSlug: "poulet-braise-alloco",
      name: "Sauce",
      type: "single",
      required: false,
      sortOrder: 1,
      options: [
        { name: "Sauce oignons", priceDelta: 0, sortOrder: 1 },
        { name: "Sauce piquante", priceDelta: 0, sortOrder: 2 },
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
      "thieb-poisson": 20,
      "yassa-poulet": 20,
      "attieke-poisson-alloco": 15,
      "pastels-maison": 30,
    },
    seasonal: {
      slug: "plateau-saveurs-africaines",
      name: "Plateau de saveurs africaines",
      description:
        "Pastels, alloco, poulet braisé et accompagnements maison à partager.",
      image: "/images/africain/pastels-alloco.webp",
      price: 29.9,
      quota: 40,
      salesStartOffsetDays: -5,
      salesEndOffsetDays: 30,
      pickupStartOffsetDays: 2,
      pickupEndOffsetDays: 30,
    },
    antiwaste: {
      title: "Panier surprise africain",
      description:
        "Assortiment des spécialités du jour : riz, grillades, alloco et accompagnements.",
      price: 8,
      originalValue: 22,
      quantity: 8,
      pickupStart: "18:00",
      pickupEnd: "19:30",
    },
  },
};

export default lauualeSimbo;
