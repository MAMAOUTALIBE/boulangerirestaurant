/**
 * Lanceur de seed générique (stratégie multi-instance).
 *
 * Le contenu d'un restaurant vit dans un « profil » (`prisma/seeds/<slug>.ts`).
 * Le profil appliqué est choisi par la variable d'environnement `SEED_PROFILE`
 * (défaut : `anatolia-grill`, le profil de démonstration). Exemples :
 *
 *   npm run db:seed                       # profil anatolia-grill (démo, dev)
 *   SEED_PROFILE=blank npm run db:seed    # squelette d'un nouveau restaurant
 *
 * ⚠️ Production : ne JAMAIS relancer le profil `anatolia-grill` (il est
 * destructif : resetStrategy "demo"). Pour provisionner un vrai restaurant, un
 * profil `additive` (upsert only, non destructif) est sûr — voir
 * MULTI-RESTAURANT.md.
 */
import { PrismaClient } from "@prisma/client";
import type { SeedOptionGroup, SeedProfile } from "./seeds/types";
import anatoliaGrill from "./seeds/anatolia-grill";
import blank from "./seeds/blank";

const prisma = new PrismaClient();

/** Registre des profils disponibles (ajouter ici chaque nouveau restaurant). */
const PROFILES: Record<string, SeedProfile> = {
  "anatolia-grill": anatoliaGrill,
  blank,
};

async function main() {
  const profileName = (process.env.SEED_PROFILE ?? "anatolia-grill").trim();
  const profile = PROFILES[profileName];
  if (!profile) {
    throw new Error(
      `Profil de seed inconnu : "${profileName}". ` +
        `Profils disponibles : ${Object.keys(PROFILES).join(", ")}.`,
    );
  }
  const isDemoReset = profile.resetStrategy === "demo";

  // ── Établissement ──────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: profile.restaurant.slug },
    update: { name: profile.restaurant.name, active: true },
    create: {
      slug: profile.restaurant.slug,
      name: profile.restaurant.name,
      active: true,
    },
  });
  if (isDemoReset) {
    await prisma.restaurant.updateMany({
      where: { slug: { not: profile.restaurant.slug } },
      data: { active: false },
    });
  }

  // ── Identité (SiteSetting) — seulement si le profil la fournit ─────────────
  if (profile.identity) {
    await prisma.siteSetting.upsert({
      where: { id: "default" },
      update: profile.identity,
      create: { id: "default", ...profile.identity },
    });
  }

  // ── Réglages de commande (OrderingSetting) ─────────────────────────────────
  // Les valeurs numériques ne sont posées qu'à la CRÉATION (on ne réécrase pas
  // un réglage ajusté depuis le CRM) ; la palette est (re)posée si fournie.
  const ordering = profile.ordering ?? {};
  await prisma.orderingSetting.upsert({
    where: { id: "default" },
    update: ordering.colorPalette
      ? { colorPalette: ordering.colorPalette }
      : {},
    create: {
      id: "default",
      ...(ordering.slotIntervalMin !== undefined
        ? { slotIntervalMin: ordering.slotIntervalMin }
        : {}),
      ...(ordering.leadTimeMin !== undefined
        ? { leadTimeMin: ordering.leadTimeMin }
        : {}),
      ...(ordering.capacityPerSlot !== undefined
        ? { capacityPerSlot: ordering.capacityPerSlot }
        : {}),
      ...(ordering.colorPalette !== undefined
        ? { colorPalette: ordering.colorPalette }
        : {}),
    },
  });

  // ── Catégories ─────────────────────────────────────────────────────────────
  const catBySlug = new Map<string, string>();
  for (const c of profile.categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: c,
    });
    catBySlug.set(c.slug, row.id);
  }

  // ── Plats ──────────────────────────────────────────────────────────────────
  for (const d of profile.dishes) {
    const prepMinutes = prepMinutesForCategory(d.category);
    const categoryId = catBySlug.get(d.category);
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
        prepMinutes,
        categoryId,
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
        prepMinutes,
        categoryId,
      },
    });
  }
  if (isDemoReset) {
    const activeDishSlugs = profile.dishes.map((d) => d.slug);
    await prisma.dish.updateMany({
      where: { slug: { notIn: activeDishSlugs } },
      data: { available: false },
    });
  }

  // ── Groupes d'options ──────────────────────────────────────────────────────
  for (const g of profile.optionGroups ?? []) {
    const dish = await prisma.dish.findUnique({ where: { slug: g.dishSlug } });
    if (dish) await resetOptionGroup(dish.id, g);
  }

  // ── Zones de livraison ─────────────────────────────────────────────────────
  for (const z of profile.deliveryZones ?? []) {
    await prisma.deliveryZone.upsert({
      where: { postalCode: z.postalCode },
      update: { fee: z.fee, minOrder: z.minOrder },
      create: z,
    });
  }

  // ── Horaires d'ouverture ───────────────────────────────────────────────────
  for (const h of profile.openingHours ?? []) {
    await prisma.openingHour.upsert({
      where: { dayOfWeek: h.dayOfWeek },
      update: { openMinutes: h.openMinutes, closeMinutes: h.closeMinutes },
      create: h,
    });
  }

  // ── Codes promo ────────────────────────────────────────────────────────────
  const promoCodes = profile.promoCodes ?? [];
  if (isDemoReset && promoCodes.length > 0) {
    await prisma.promoCode.updateMany({
      where: { code: { notIn: promoCodes.map((p) => p.code) } },
      data: { active: false },
    });
  }
  for (const p of promoCodes) {
    const active = p.active ?? true;
    await prisma.promoCode.upsert({
      where: { code: p.code },
      update: { type: p.type, value: p.value, active },
      create: { code: p.code, type: p.type, value: p.value, active },
    });
  }

  // ── Fixtures de démonstration (stock / saison / anti-gaspi) ─────────────────
  if (profile.demo) await seedDemoFixtures(profile.demo);

  const dishes = await prisma.dish.count();
  const zones = await prisma.deliveryZone.count();
  console.log(
    `✓ Seed [${profileName}] : ${dishes} produits, ${profile.categories.length} catégories, ${zones} zones, établissement ${restaurant.slug}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/** Recrée un groupe d'options (et ses options) de façon idempotente. */
async function resetOptionGroup(dishId: string, input: SeedOptionGroup) {
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

/** Applique les fixtures de démo. Fenêtres exprimées en décalage de jours. */
async function seedDemoFixtures(demo: NonNullable<SeedProfile["demo"]>) {
  const dayMs = 86400000;
  const seedNow = new Date();

  for (const [slug, dailyStock] of Object.entries(demo.stock ?? {})) {
    await prisma.dish.updateMany({ where: { slug }, data: { dailyStock } });
  }

  if (demo.seasonal) {
    const s = demo.seasonal;
    const isoDay = (offset: number) =>
      new Date(seedNow.getTime() + offset * dayMs).toISOString().slice(0, 10);
    const window = {
      salesStart: new Date(seedNow.getTime() + s.salesStartOffsetDays * dayMs),
      salesEnd: new Date(seedNow.getTime() + s.salesEndOffsetDays * dayMs),
      pickupStart: isoDay(s.pickupStartOffsetDays),
      pickupEnd: isoDay(s.pickupEndOffsetDays),
      active: true,
    };
    await prisma.seasonalProduct.updateMany({
      where: { slug: { not: s.slug } },
      data: { active: false },
    });
    await prisma.seasonalProduct.upsert({
      where: { slug: s.slug },
      update: window,
      create: {
        slug: s.slug,
        name: s.name,
        description: s.description,
        image: s.image,
        price: s.price,
        quota: s.quota,
        ...window,
      },
    });
  }

  if (demo.antiwaste) {
    const a = demo.antiwaste;
    const todayParis = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
    }).format(seedNow);
    await prisma.antiWasteOffer.upsert({
      where: { date: todayParis },
      update: { quantity: a.quantity, active: true },
      create: {
        date: todayParis,
        title: a.title,
        description: a.description,
        price: a.price,
        originalValue: a.originalValue,
        quantity: a.quantity,
        pickupStart: a.pickupStart,
        pickupEnd: a.pickupEnd,
      },
    });
  }
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
