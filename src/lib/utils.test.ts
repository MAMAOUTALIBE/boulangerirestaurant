import { describe, it, expect } from "vitest";
import { cn, formatPrice } from "@/lib/utils";

describe("formatPrice", () => {
  it("formate un entier en euros", () => {
    // Espace insécable utilisé par Intl en fr-FR.
    expect(formatPrice(15).replace(/ /g, " ")).toBe("15,00 €");
  });

  it("gère les décimales", () => {
    expect(formatPrice(14.5).replace(/ /g, " ")).toBe("14,50 €");
  });

  it("gère zéro", () => {
    expect(formatPrice(0).replace(/ /g, " ")).toBe("0,00 €");
  });
});

describe("cn", () => {
  it("fusionne et dédoublonne les classes Tailwind conflictuelles", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("gère les valeurs conditionnelles", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
