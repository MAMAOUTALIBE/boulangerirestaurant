import { PrismaClient } from "@prisma/client";
import { seedDishes } from "../src/data/dishes";

const prisma = new PrismaClient();

const categories = [
  { slug: "pains", name: "Pains artisanaux", sortOrder: 1 },
  { slug: "viennoiseries", name: "Viennoiseries", sortOrder: 2 },
  { slug: "patisseries", name: "Pâtisseries", sortOrder: 3 },
  { slug: "snacking", name: "Snacking", sortOrder: 4 },
  { slug: "boissons", name: "Boissons", sortOrder: 5 },
];

const extraDishes = [
  {
    slug: "pain-complet-graines",
    name: "Pain complet aux graines",
    description: "Farine complète, graines torréfiées et levain naturel",
    price: 4.8,
    image: "/images/menu/pain-complet-graines.webp",
    category: "pains",
    sortOrder: 1,
  },
  {
    slug: "chausson-pommes",
    name: "Chausson aux pommes",
    description: "Compotée de pommes, feuilletage pur beurre et dorure légère",
    price: 2.6,
    image: "/images/menu/chausson-pommes.webp",
    category: "viennoiseries",
    sortOrder: 2,
  },
  {
    slug: "brioche-tressee",
    name: "Brioche tressée",
    description: "Brioche moelleuse au beurre, idéale pour le goûter",
    price: 6.5,
    image: "/images/menu/brioche-tressee.webp",
    category: "viennoiseries",
    sortOrder: 3,
  },
  {
    slug: "flan-patissier",
    name: "Flan pâtissier",
    description: "Crème vanillée, pâte croustillante et cuisson bien dorée",
    price: 4.4,
    image: "/images/menu/flan-patissier.webp",
    category: "patisseries",
    sortOrder: 1,
  },
  {
    slug: "paris-brest",
    name: "Paris-Brest",
    description: "Pâte à choux, crème pralinée et amandes effilées",
    price: 5.2,
    image: "/images/menu/paris-brest.webp",
    category: "patisseries",
    sortOrder: 2,
  },
  {
    slug: "cafe-allonge",
    name: "Café allongé",
    description: "Café fraîchement moulu, servi chaud",
    price: 2.2,
    image: "/images/menu/cafe-allonge.webp",
    category: "boissons",
    sortOrder: 1,
  },
  {
    slug: "jus-orange-presse",
    name: "Jus d'orange pressé",
    description: "Oranges pressées à la commande",
    price: 3.9,
    image: "/images/menu/jus-orange-presse.webp",
    category: "boissons",
    sortOrder: 2,
  },
  {
    slug: "chocolat-chaud",
    name: "Chocolat chaud",
    description: "Chocolat onctueux au lait, préparé minute",
    price: 3.4,
    image: "/images/menu/chocolat-chaud.webp",
    category: "boissons",
    sortOrder: 3,
  },
];

const legacyDishSlugs = [
  "adana-kebab",
  "ayran",
  "baklava",
  "borek-fromage",
  "houmous",
  "iskender-kebab",
  "kebab-grille",
  "kofte",
  "lahmacun",
  "manti",
  "mercimek-corbasi",
  "pide-sucuk",
  "sodas-frais",
  "sutlac",
  "the-turc",
];

async function main() {
  // Établissement par défaut (base mono-site aujourd'hui, prêt multi-sites).
  const defaultRestaurant = await prisma.restaurant.upsert({
    where: { slug: "boulangerie" },
    update: { name: "Boulangerie Artisanale", active: true },
    create: {
      slug: "boulangerie",
      name: "Boulangerie Artisanale",
      active: true,
    },
  });
  await prisma.restaurant.updateMany({
    where: { slug: "restaurant" },
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

  // Options de démonstration sur le sandwich.
  const sandwich = await prisma.dish.findUnique({
    where: { slug: "sandwich-baguette-poulet" },
  });
  if (sandwich) {
    await resetDemoOptionGroup(sandwich.id, {
      name: "Pain",
      type: "single",
      required: true,
      sortOrder: 1,
      options: [
        { name: "Baguette tradition", priceDelta: 0, sortOrder: 1 },
        { name: "Pain complet", priceDelta: 0.5, sortOrder: 2 },
        { name: "Focaccia", priceDelta: 0.8, sortOrder: 3 },
      ],
    });
    await resetDemoOptionGroup(sandwich.id, {
      name: "Suppléments",
      type: "multi",
      required: false,
      sortOrder: 2,
      options: [
        { name: "Comté", priceDelta: 1, sortOrder: 1 },
        { name: "Avocat", priceDelta: 1.5, sortOrder: 2 },
        { name: "Boisson 33 cl", priceDelta: 2, sortOrder: 3 },
      ],
    });
  }

  await prisma.dish.updateMany({
    where: { slug: { in: legacyDishSlugs } },
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

  // Horaires d'ouverture (7h–19h30 tous les jours) + réglages de commande.
  for (let day = 0; day < 7; day++) {
    await prisma.openingHour.upsert({
      where: { dayOfWeek: day },
      update: { openMinutes: 7 * 60, closeMinutes: 19 * 60 + 30 },
      create: {
        dayOfWeek: day,
        openMinutes: 7 * 60,
        closeMinutes: 19 * 60 + 30,
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
    where: { code: "RESTAURANT10" },
    data: { active: false },
  });
  await prisma.promoCode.upsert({
    where: { code: "BOULANGERIE10" },
    update: { type: "percent", value: 10, active: true },
    create: {
      code: "BOULANGERIE10",
      type: "percent",
      value: 10,
      active: true,
    },
  });
  // Stock du jour de démonstration (limité, pour illustrer les ruptures).
  const demoStock: Record<string, number> = {
    "paris-brest": 6,
    "tartelette-fruits": 8,
    "eclair-chocolat": 10,
    "baguette-tradition": 40,
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
  await prisma.seasonalProduct.upsert({
    where: { slug: "galette-des-rois" },
    update: seasonalWindow,
    create: {
      slug: "galette-des-rois",
      name: "Galette des Rois (frangipane)",
      description:
        "Galette pur beurre à la frangipane, fève incluse. En précommande, quantités limitées.",
      image: "/images/boulangerie-patisseries.webp",
      price: 18.5,
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
      title: "Panier surprise du soir",
      description:
        "Assortiment d'invendus du jour : pains, viennoiseries et pâtisseries.",
      price: 5,
      originalValue: 15,
      quantity: 8,
      pickupStart: "18:00",
      pickupEnd: "19:30",
    },
  });

  const dishes = await prisma.dish.count();
  const zones = await prisma.deliveryZone.count();
  console.log(
    `✓ Seed : ${dishes} produits, ${categories.length} catégories, ${zones} zones, BOULANGERIE10, établissement ${defaultRestaurant.slug}.`,
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
    pains: 5,
    viennoiseries: 5,
    patisseries: 5,
    snacking: 12,
    boissons: 2,
  };
  return prepByCat[category] ?? 10;
}
