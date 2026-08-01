import { describe, expect, it } from "vitest";
import { seedDishes } from "./dishes";

const galleryDishSlugs = [
  "poisson-tubercules-sauce",
  "haricots-poulet",
  "mafe-poulet",
  "poisson-alloko",
  "poisson-grille-crudites",
  "poisson-oignons",
  "riz-rouge-poulet",
  "riz-poulet-legumes",
  "menu-poisson-alloko",
  "menu-poisson-alloko-degue-orange",
  "menu-mafe-degue-orange",
  "menu-riz-rouge-poulet-alloko",
  "formule-riz-poulet-alloko",
] as const;

describe("plats issus de la galerie", () => {
  it("installe les treize produits à 5 € avec leur photo", () => {
    const dishes = galleryDishSlugs.map((slug) =>
      seedDishes.find((dish) => dish.slug === slug),
    );

    expect(dishes).toHaveLength(13);
    for (const dish of dishes) {
      expect(dish).toBeDefined();
      expect(dish?.price).toBe(5);
      expect(dish?.image).toMatch(/^\/images\/africain\/\d{2}_/);
    }
  });

  it("range les cinq formules dans la catégorie modifiable des menus", () => {
    const menus = seedDishes.filter((dish) => dish.slug.startsWith("menu-"));

    expect(menus).toHaveLength(4);
    const formules = seedDishes.filter(
      (dish) =>
        dish.slug.startsWith("menu-") || dish.slug.startsWith("formule-"),
    );

    expect(formules).toHaveLength(5);
    expect(formules.every((dish) => dish.category === "menus-complets")).toBe(
      true,
    );
  });
});

const secondMenuBatch = {
  "sauce-mafe-riz": 5,
  "sauce-tomate-riz": 5,
  "sauce-yassa-riz": 5,
  "sauce-epinards-riz": 5,
  "thieb-poulet": 5,
  "haricots-poulet": 5,
  alloco: 5,
  "boeuf-grille": 5,
  "soupe-boeuf-mijotee": 5,
  "attieke-legumes": 5,
  tilapia: 6,
  "capitaine-entier": 12,
  "demi-capitaine": 6,
  "djouka-fonio": 5,
  "patate-douce": 5,
  "cuisse-poulet": 2.5,
  "brochettes-boeuf-poulet": 1.5,
  "pastels-maison": 1,
} as const;

describe("second lot du menu", () => {
  it("installe les dix-huit produits avec leur prix et leur nouvelle photo", () => {
    const entries = Object.entries(secondMenuBatch);

    expect(entries).toHaveLength(18);
    for (const [slug, price] of entries) {
      const dish = seedDishes.find((candidate) => candidate.slug === slug);

      expect(dish, slug).toBeDefined();
      expect(dish?.price, slug).toBe(price);
      expect(dish?.image, slug).toMatch(/^\/images\/africain\/(?:2\d|3[0-7])_/);
    }
  });

  it("conserve les plats avec viande distincts des sauces seules", () => {
    expect(seedDishes.find((dish) => dish.slug === "yassa-poulet")?.price).toBe(
      14.9,
    );
    expect(seedDishes.find((dish) => dish.slug === "mafe-boeuf")?.price).toBe(
      15.9,
    );
    expect(seedDishes.find((dish) => dish.slug === "mafe-poulet")?.name).toBe(
      "Mafé au poulet",
    );
  });

  it("ne contient aucun slug dupliqué", () => {
    const slugs = seedDishes.map((dish) => dish.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
