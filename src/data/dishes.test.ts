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
  "menu-poisson-alloko",
  "menu-poisson-alloko-degue-orange",
  "menu-mafe-degue-orange",
  "menu-riz-rouge-poulet-alloko",
] as const;

describe("plats issus de la galerie", () => {
  it("installe les onze produits à 5 € avec leur photo", () => {
    const dishes = galleryDishSlugs.map((slug) =>
      seedDishes.find((dish) => dish.slug === slug),
    );

    expect(dishes).toHaveLength(11);
    for (const dish of dishes) {
      expect(dish).toBeDefined();
      expect(dish?.price).toBe(5);
      expect(dish?.image).toMatch(/^\/images\/africain\/\d{2}_/);
    }
  });

  it("range les quatre formules dans la catégorie modifiable des menus", () => {
    const menus = seedDishes.filter((dish) =>
      dish.slug.startsWith("menu-"),
    );

    expect(menus).toHaveLength(4);
    expect(menus.every((dish) => dish.category === "menus-complets")).toBe(
      true,
    );
  });
});
