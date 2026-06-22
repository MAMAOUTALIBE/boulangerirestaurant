import { describe, it, expect } from "vitest";
import {
  remainingStock,
  isSoldOut,
  stockToday,
  type StockFields,
} from "./stock";

const today = stockToday();

describe("remainingStock", () => {
  it("renvoie null quand le stock est illimité", () => {
    const dish: StockFields = {
      dailyStock: null,
      soldToday: 5,
      stockDate: today,
    };
    expect(remainingStock(dish)).toBeNull();
    expect(isSoldOut(dish)).toBe(false);
  });

  it("déduit les ventes du jour", () => {
    const dish: StockFields = {
      dailyStock: 10,
      soldToday: 3,
      stockDate: today,
    };
    expect(remainingStock(dish)).toBe(7);
    expect(isSoldOut(dish)).toBe(false);
  });

  it("repart du stock plein un nouveau jour (compteur périmé ignoré)", () => {
    const dish: StockFields = {
      dailyStock: 10,
      soldToday: 9,
      stockDate: "2020-01-01",
    };
    expect(remainingStock(dish)).toBe(10);
  });

  it("ne descend jamais sous zéro et signale l'épuisement", () => {
    const dish: StockFields = { dailyStock: 4, soldToday: 6, stockDate: today };
    expect(remainingStock(dish)).toBe(0);
    expect(isSoldOut(dish)).toBe(true);
  });

  it("traite un stock à zéro comme épuisé", () => {
    const dish: StockFields = { dailyStock: 0, soldToday: 0, stockDate: today };
    expect(remainingStock(dish)).toBe(0);
    expect(isSoldOut(dish)).toBe(true);
  });
});
