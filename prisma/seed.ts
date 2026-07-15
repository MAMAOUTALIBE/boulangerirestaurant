import { PrismaClient } from "@prisma/client";
import { seedDishes } from "../src/data/dishes";

const prisma = new PrismaClient();

const categories = [
  { slug: "entrees", name: "Entrées & Mezze", sortOrder: 1 },
  { slug: "grillades", name: "Grillades & Kebabs", sortOrder: 2 },
  { slug: "pide", name: "Pide & Lahmacun", sortOrder: 3 },
  { slug: "specialites", name: "Spécialités", sortOrder: 4 },
  { slug: "desserts", name: "Desserts", sortOrder: 5 },
  { slug: "boissons", name: "Boissons", sortOrder: 6 },
];

const extraDishes = [
  {
    slug: "mercimek-corbasi",
    name: "Mercimek çorbası",
    description: "Soupe crémeuse de lentilles corail, cumin et filet de citron",
    price: 5.5,
    image: "/images/about-3.jpg",
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
    image: "/images/hero-plateau-turc-premium.png",
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

async function main() {
  // Établissement par défaut (base mono-site aujourd'hui, prêt multi-sites).
  const defaultRestaurant = await prisma.restaurant.upsert({
    where: { slug: "anatolia-grill" },
    update: { name: "Restaurant", active: true },
    create: {
      slug: "anatolia-grill",
      name: "Restaurant",
      active: true,
    },
  });
  await prisma.restaurant.updateMany({
    where: { slug: { not: "anatolia-grill" } },
    data: { active: false },
  });

  // Catégories
  const catBySlug = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: c,
    });
    catBySlug.set(c.slug, row.id);
  }

  // Produits principaux.
  for (const d of seedDishes) {
    await prisma.dish.upsert({
      where: { slug: d.slug },
      update: {
        name: d.name,
        description: d.description,
        price: d.price,
        image: d.image,
        tag: d.tag ?? null,
        available: true,
        sortOrder: d.sortOrder,
        prepMinutes: prepMinutesForCategory(d.category),
        categoryId: catBySlug.get(d.category),
      },
      create: {
        slug: d.slug,
        name: d.name,
        description: d.description,
        price: d.price,
        image: d.image,
        tag: d.tag ?? null,
        available: true,
        sortOrder: d.sortOrder,
        prepMinutes: prepMinutesForCategory(d.category),
        categoryId: catBySlug.get(d.category),
      },
    });
  }

  // Produits complémentaires.
  for (const d of extraDishes) {
    const prepMinutes = prepMinutesForCategory(d.category);
    await prisma.dish.upsert({
      where: { slug: d.slug },
      update: {
        name: d.name,
        description: d.description,
        price: d.price,
        image: d.image,
        available: true,
        sortOrder: d.sortOrder,
        prepMinutes,
        categoryId: catBySlug.get(d.category),
      },
      create: {
        slug: d.slug,
        name: d.name,
        description: d.description,
        price: d.price,
        image: d.image,
        available: true,
        sortOrder: d.sortOrder,
        prepMinutes,
        categoryId: catBySlug.get(d.category),
      },
    });
  }

  // Options de démonstration sur le kebab grillé.
  const kebab = await prisma.dish.findUnique({
    where: { slug: "kebab-grille" },
  });
  if (kebab) {
    await resetDemoOptionGroup(kebab.id, {
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
    });
    await resetDemoOptionGroup(kebab.id, {
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
    });
  }

  const activeDishSlugs = [...seedDishes, ...extraDishes].map((d) => d.slug);
  await prisma.dish.updateMany({
    where: { slug: { notIn: activeDishSlugs } },
    data: { available: false },
  });

  // Zones de livraison
  for (const z of [
    { postalCode: "91260", fee: 3.5, minOrder: 15 },
    { postalCode: "91200", fee: 4.5, minOrder: 20 },
    { postalCode: "91600", fee: 4, minOrder: 18 },
  ]) {
    await prisma.deliveryZone.upsert({
      where: { postalCode: z.postalCode },
      update: { fee: z.fee, minOrder: z.minOrder },
      create: z,
    });
  }

  // Horaires d'ouverture (11h30–23h tous les jours) + réglages de commande.
  for (let day = 0; day < 7; day++) {
    await prisma.openingHour.upsert({
      where: { dayOfWeek: day },
      update: { openMinutes: 11 * 60 + 30, closeMinutes: 23 * 60 },
      create: {
        dayOfWeek: day,
        openMinutes: 11 * 60 + 30,
        closeMinutes: 23 * 60,
      },
    });
  }
  await prisma.orderingSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      slotIntervalMin: 15,
      leadTimeMin: 20,
      capacityPerSlot: 8,
    },
  });

  // Code promo affiché sur le site.
  await prisma.promoCode.updateMany({
    where: { code: { not: "BIENVENUE10" } },
    data: { active: false },
  });
  await prisma.promoCode.upsert({
    where: { code: "BIENVENUE10" },
    update: { type: "percent", value: 10, active: true },
    create: {
      code: "BIENVENUE10",
      type: "percent",
      value: 10,
      active: true,
    },
  });
  // Stock du jour de démonstration (limité, pour illustrer les ruptures).
  const demoStock: Record<string, number> = {
    "adana-kebab": 20,
    "iskender-kebab": 15,
    lahmacun: 30,
    baklava: 24,
  };
  for (const [slug, dailyStock] of Object.entries(demoStock)) {
    await prisma.dish.updateMany({ where: { slug }, data: { dailyStock } });
  }

  // Offre de saison de démonstration (fenêtre de vente ouverte autour du seed).
  const dayMs = 86400000;
  const seedNow = new Date();
  const isoDay = (offset: number) =>
    new Date(seedNow.getTime() + offset * dayMs).toISOString().slice(0, 10);
  const seasonalWindow = {
    salesStart: new Date(seedNow.getTime() - 5 * dayMs),
    salesEnd: new Date(seedNow.getTime() + 30 * dayMs),
    pickupStart: isoDay(2),
    pickupEnd: isoDay(30),
    active: true,
  };
  await prisma.seasonalProduct.updateMany({
    where: { slug: { not: "plateau-baklava" } },
    data: { active: false },
  });
  await prisma.seasonalProduct.upsert({
    where: { slug: "plateau-baklava" },
    update: seasonalWindow,
    create: {
      slug: "plateau-baklava",
      name: "Plateau de baklava assorti",
      description:
        "Assortiment de baklava pistache et noix, fait maison. En précommande, quantités limitées.",
      image: "/images/hero-slide-desserts-turcs.png",
      price: 24.9,
      quota: 50,
      ...seasonalWindow,
    },
  });

  // Panier anti-gaspi de démonstration pour aujourd'hui (fuseau Europe/Paris).
  const todayParis = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
  }).format(seedNow);
  await prisma.antiWasteOffer.upsert({
    where: { date: todayParis },
    update: { quantity: 8, active: true },
    create: {
      date: todayParis,
      title: "Plateau surprise du soir",
      description:
        "Assortiment de spécialités du jour : grillades, pide, mezze et accompagnements.",
      price: 8,
      originalValue: 22,
      quantity: 8,
      pickupStart: "18:00",
      pickupEnd: "19:30",
    },
  });

  const dishes = await prisma.dish.count();
  const zones = await prisma.deliveryZone.count();
  console.log(
    `✓ Seed : ${dishes} produits, ${categories.length} catégories, ${zones} zones, BIENVENUE10, établissement ${defaultRestaurant.slug}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

async function resetDemoOptionGroup(
  dishId: string,
  input: {
    name: string;
    type: string;
    required: boolean;
    sortOrder: number;
    options: { name: string; priceDelta: number; sortOrder: number }[];
  },
) {
  const group = await prisma.optionGroup.findFirst({
    where: { dishId, name: input.name },
  });

  if (group) {
    await prisma.option.deleteMany({ where: { groupId: group.id } });
    await prisma.optionGroup.update({
      where: { id: group.id },
      data: {
        type: input.type,
        required: input.required,
        sortOrder: input.sortOrder,
        options: { create: input.options },
      },
    });
    return;
  }

  await prisma.optionGroup.create({
    data: {
      dishId,
      name: input.name,
      type: input.type,
      required: input.required,
      sortOrder: input.sortOrder,
      options: { create: input.options },
    },
  });
}

function prepMinutesForCategory(category: string): number {
  const prepByCat: Record<string, number> = {
    entrees: 8,
    grillades: 18,
    pide: 14,
    specialites: 15,
    desserts: 4,
    boissons: 2,
  };
  return prepByCat[category] ?? 10;
}
