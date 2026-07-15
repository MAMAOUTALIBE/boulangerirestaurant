import { describe, expect, it } from "vitest";
import {
  birthdayMatches,
  classifyWeather,
  isInactiveForDays,
  periodKey,
} from "./marketing-rules";

describe("règles marketing", () => {
  it("classe la météo avec priorité à la pluie", () => {
    expect(
      classifyWeather({ temperature: 30, precipitation: 1, weatherCode: 61 }),
    ).toBe("pluie");
    expect(
      classifyWeather({ temperature: 5, precipitation: 0, weatherCode: 0 }),
    ).toBe("froid");
    expect(
      classifyWeather({ temperature: 30, precipitation: 0, weatherCode: 0 }),
    ).toBe("chaud");
  });

  it("compare un anniversaire sans tenir compte de l’année", () => {
    expect(
      birthdayMatches(
        new Date("1990-07-15T00:00:00Z"),
        new Date("2026-07-15T10:00:00Z"),
      ),
    ).toBe(true);
    expect(
      birthdayMatches(
        new Date("1990-07-16T00:00:00Z"),
        new Date("2026-07-15T10:00:00Z"),
      ),
    ).toBe(false);
  });

  it("détecte une inactivité minimale", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    expect(isInactiveForDays(new Date("2026-06-01T12:00:00Z"), 30, now)).toBe(
      true,
    );
    expect(isInactiveForDays(new Date("2026-07-01T12:00:00Z"), 30, now)).toBe(
      false,
    );
  });

  it("génère des clés de période stables", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    expect(periodKey(now, "jour")).toBe("2026-07-15");
    expect(periodKey(now, "mois")).toBe("2026-07");
    expect(periodKey(now, "année")).toBe("2026");
  });
});
