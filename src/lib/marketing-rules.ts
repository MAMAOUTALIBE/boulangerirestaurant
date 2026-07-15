export type WeatherKind = "pluie" | "froid" | "chaud" | "doux";

export function classifyWeather(input: {
  temperature: number;
  precipitation: number;
  weatherCode: number;
}): WeatherKind {
  if (
    input.precipitation > 0 ||
    (input.weatherCode >= 51 && input.weatherCode <= 99)
  ) {
    return "pluie";
  }
  if (input.temperature <= 8) return "froid";
  if (input.temperature >= 27) return "chaud";
  return "doux";
}

export function birthdayMatches(birthDate: Date | null, now: Date): boolean {
  return Boolean(
    birthDate &&
    birthDate.getUTCMonth() === now.getUTCMonth() &&
    birthDate.getUTCDate() === now.getUTCDate(),
  );
}

export function isInactiveForDays(
  lastOrderAt: Date | null,
  minimumDays: number,
  now: Date,
): boolean {
  if (!lastOrderAt) return false;
  const elapsed = now.getTime() - lastOrderAt.getTime();
  return elapsed >= minimumDays * 86_400_000;
}

export function periodKey(
  now: Date,
  cadence: "jour" | "mois" | "année",
): string {
  const iso = now.toISOString();
  if (cadence === "jour") return iso.slice(0, 10);
  if (cadence === "mois") return iso.slice(0, 7);
  return iso.slice(0, 4);
}
