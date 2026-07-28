import { describe, expect, it } from "vitest";
import {
  buildPaletteStyle,
  darken,
  deriveAccentShades,
  lighten,
  parseHex,
  resolvePaletteName,
  toRgbTriplet,
} from "./palette";

describe("parseHex", () => {
  it("accepte les formes courtes et longues, avec ou sans dièse", () => {
    expect(parseHex("#F59E0B")).toEqual({ r: 245, g: 158, b: 11 });
    expect(parseHex("f59e0b")).toEqual({ r: 245, g: 158, b: 11 });
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("  #000  ")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("refuse une saisie invalide", () => {
    expect(parseHex("")).toBeNull();
    expect(parseHex("rouge")).toBeNull();
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("#gggggg")).toBeNull();
    expect(parseHex("rgb(1,2,3)")).toBeNull();
  });
});

describe("lighten / darken", () => {
  it("reste dans les bornes 0-255", () => {
    expect(lighten({ r: 250, g: 250, b: 250 }, 1)).toEqual({
      r: 255,
      g: 255,
      b: 255,
    });
    expect(darken({ r: 10, g: 10, b: 10 }, 1)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("ne change rien avec un ratio nul", () => {
    const couleur = { r: 120, g: 80, b: 40 };
    expect(lighten(couleur, 0)).toEqual(couleur);
    expect(darken(couleur, 0)).toEqual(couleur);
  });
});

describe("deriveAccentShades", () => {
  it("produit cinq nuances au format attendu par les variables CSS", () => {
    const nuances = deriveAccentShades({ r: 245, g: 158, b: 11 });
    for (const valeur of Object.values(nuances)) {
      expect(valeur).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
    }
  });

  it("garde l'accent choisi tel quel", () => {
    const nuances = deriveAccentShades({ r: 12, g: 200, b: 90 });
    expect(nuances.gold).toBe("12 200 90");
  });

  it("ordonne les nuances du plus clair au plus foncé", () => {
    const somme = (triplet: string) =>
      triplet.split(" ").reduce((total, n) => total + Number(n), 0);
    const n = deriveAccentShades({ r: 200, g: 120, b: 60 });
    expect(somme(n.gold400)).toBeGreaterThan(somme(n.gold));
    expect(somme(n.gold)).toBeGreaterThan(somme(n.gold600));
    expect(somme(n.gold600)).toBeGreaterThan(somme(n.forest600));
    expect(somme(n.forest600)).toBeGreaterThan(somme(n.forest));
  });

  it("reste stable sur les couleurs extrêmes", () => {
    for (const couleur of [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
    ]) {
      const nuances = deriveAccentShades(couleur);
      for (const valeur of Object.values(nuances)) {
        expect(valeur).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
      }
    }
  });
});

describe("resolvePaletteName", () => {
  it("accepte les palettes connues", () => {
    expect(resolvePaletteName("terracotta")).toBe("terracotta");
    expect(resolvePaletteName("perso")).toBe("perso");
  });

  it("retombe sur ambre pour toute valeur inattendue", () => {
    expect(resolvePaletteName(null)).toBe("ambre");
    expect(resolvePaletteName("")).toBe("ambre");
    expect(resolvePaletteName("fuchsia")).toBe("ambre");
  });
});

describe("buildPaletteStyle", () => {
  it("ne renvoie rien pour les palettes prêtes (gérées par globals.css)", () => {
    expect(buildPaletteStyle("ambre", "#F59E0B")).toBeUndefined();
    expect(buildPaletteStyle("emeraude", "#F59E0B")).toBeUndefined();
  });

  it("produit les cinq variables CSS en mode personnalisé", () => {
    const style = buildPaletteStyle("perso", "#8B5CF6");
    expect(Object.keys(style ?? {})).toEqual([
      "--color-gold",
      "--color-gold-600",
      "--color-gold-400",
      "--color-forest",
      "--color-forest-600",
    ]);
    expect(style?.["--color-gold"]).toBe("139 92 246");
  });

  it("retombe sur la palette par défaut si la couleur est invalide ou absente", () => {
    expect(buildPaletteStyle("perso", "pas-une-couleur")).toBeUndefined();
    expect(buildPaletteStyle("perso", null)).toBeUndefined();
    expect(buildPaletteStyle("perso", "")).toBeUndefined();
  });
});

describe("toRgbTriplet", () => {
  it("sérialise au format des variables CSS du thème", () => {
    expect(toRgbTriplet({ r: 1, g: 22, b: 255 })).toBe("1 22 255");
  });
});
