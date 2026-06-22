import { describe, it, expect } from "vitest";
import {
  computeSegment,
  needsReengagement,
  daysSince,
} from "@/lib/segmentation";

describe("computeSegment", () => {
  it("classe un client sans commande en Prospect", () => {
    expect(
      computeSegment({
        ordersCount: 0,
        totalSpent: 0,
        daysSinceLastOrder: null,
      }),
    ).toBe("Prospect");
  });

  it("classe un gros client récent en VIP", () => {
    expect(
      computeSegment({
        ordersCount: 5,
        totalSpent: 200,
        daysSinceLastOrder: 5,
      }),
    ).toBe("VIP");
  });

  it("classe un client régulier mais peu dépensier en Fidèle", () => {
    expect(
      computeSegment({
        ordersCount: 4,
        totalSpent: 40,
        daysSinceLastOrder: 10,
      }),
    ).toBe("Fidèle");
  });

  it("classe une première commande récente en Nouveau", () => {
    expect(
      computeSegment({ ordersCount: 1, totalSpent: 15, daysSinceLastOrder: 3 }),
    ).toBe("Nouveau");
  });

  it("classe l'inactivité 30-90j en À risque", () => {
    expect(
      computeSegment({
        ordersCount: 2,
        totalSpent: 30,
        daysSinceLastOrder: 45,
      }),
    ).toBe("À risque");
  });

  it("classe l'inactivité > 90j en Perdu", () => {
    expect(
      computeSegment({
        ordersCount: 3,
        totalSpent: 60,
        daysSinceLastOrder: 120,
      }),
    ).toBe("Perdu");
  });
});

describe("needsReengagement", () => {
  it("cible les segments à risque et perdus", () => {
    expect(needsReengagement("À risque")).toBe(true);
    expect(needsReengagement("Perdu")).toBe(true);
    expect(needsReengagement("VIP")).toBe(false);
  });
});

describe("daysSince", () => {
  it("retourne null sans date", () => {
    expect(daysSince(null, Date.now())).toBeNull();
  });
  it("calcule le nombre de jours", () => {
    const now = Date.UTC(2026, 0, 11);
    const tenDaysAgo = new Date(Date.UTC(2026, 0, 1)).toISOString();
    expect(daysSince(tenDaysAgo, now)).toBe(10);
  });
});
