import { describe, it, expect } from "vitest";
import { buildHeatmap, forecastRevenue } from "@/lib/analytics";

describe("forecastRevenue", () => {
  it("calcule moyenne, tendance et projections", () => {
    const totals = [...Array(7).fill(100), ...Array(7).fill(200)];
    const f = forecastRevenue(totals);
    expect(f.dailyAverage).toBe(200);
    expect(f.trendPct).toBe(100);
    expect(f.next7).toBe(1400);
    expect(f.next30).toBe(6000);
  });

  it("gère l'absence d'historique", () => {
    const f = forecastRevenue([]);
    expect(f.dailyAverage).toBe(0);
    expect(f.next30).toBe(0);
  });
});

describe("buildHeatmap", () => {
  it("compte les commandes par jour et heure", () => {
    // 2026-06-01 = lundi.
    const lundi12 = new Date(2026, 5, 1, 12, 30).toISOString();
    const lundi12b = new Date(2026, 5, 1, 12, 5).toISOString();
    const mardi19 = new Date(2026, 5, 2, 19, 0).toISOString();
    const h = buildHeatmap([lundi12, lundi12b, mardi19]);

    expect(h.total).toBe(3);
    expect(h.max).toBe(2);
    expect(h.busiest).toEqual({ day: "Lun", hour: 12, count: 2 });
  });

  it("ignore les heures hors plage d'ouverture", () => {
    const minuit = new Date(2026, 5, 1, 0, 0).toISOString();
    const h = buildHeatmap([minuit], 11, 23);
    expect(h.total).toBe(0);
  });

  it("place dimanche en dernière ligne", () => {
    // 2026-06-07 = dimanche.
    const dim = new Date(2026, 5, 7, 13, 0).toISOString();
    const h = buildHeatmap([dim]);
    expect(h.busiest?.day).toBe("Dim");
  });
});
