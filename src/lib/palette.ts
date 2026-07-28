/**
 * Palette d'accent personnalisée — pur / testable (pas de `server-only`, pas de DB).
 *
 * Le CRM propose trois palettes prêtes (`ambre`, `terracotta`, `emeraude`,
 * définies dans `globals.css`) plus une couleur libre. Dans ce dernier cas, le
 * restaurateur ne choisit QU'UNE couleur : les nuances claires/foncées et le
 * ton secondaire en sont dérivés ici, pour qu'il n'ait pas à composer une
 * palette cohérente lui-même.
 *
 * Les valeurs sont produites au format « R G B » attendu par les variables CSS
 * de `globals.css` (`--color-gold: 245 158 11`), afin que Tailwind continue de
 * gérer l'opacité (`bg-gold/15`).
 */

/** Palettes prêtes à l'emploi, plus le mode couleur libre. */
export const PALETTES = ["ambre", "terracotta", "emeraude", "perso"] as const;
export type PaletteName = (typeof PALETTES)[number];

/** Libellés affichés dans le CRM. */
export const PALETTE_LABELS: Record<PaletteName, string> = {
  ambre: "Ambre (par défaut)",
  terracotta: "Terracotta",
  emeraude: "Émeraude",
  perso: "Couleur personnalisée",
};

/** Renvoie le nom de palette s'il est connu, sinon « ambre ». */
export function resolvePaletteName(value?: string | null): PaletteName {
  return PALETTES.includes(value as PaletteName)
    ? (value as PaletteName)
    : "ambre";
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Analyse une couleur hexadécimale (`#RGB` ou `#RRGGBB`, dièse optionnel).
 * Renvoie `null` si la saisie n'est pas une couleur valide.
 */
export function parseHex(value: string): Rgb | null {
  const brut = value.trim().replace(/^#/, "");
  const hex =
    brut.length === 3
      ? brut
          .split("")
          .map((c) => c + c)
          .join("")
      : brut;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/** Format « R G B » attendu par les variables CSS du thème. */
export function toRgbTriplet({ r, g, b }: Rgb): string {
  return `${r} ${g} ${b}`;
}

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Éclaircit une couleur vers le blanc (`ratio` entre 0 et 1). */
export function lighten(color: Rgb, ratio: number): Rgb {
  return {
    r: clamp(color.r + (255 - color.r) * ratio),
    g: clamp(color.g + (255 - color.g) * ratio),
    b: clamp(color.b + (255 - color.b) * ratio),
  };
}

/** Assombrit une couleur vers le noir (`ratio` entre 0 et 1). */
export function darken(color: Rgb, ratio: number): Rgb {
  return {
    r: clamp(color.r * (1 - ratio)),
    g: clamp(color.g * (1 - ratio)),
    b: clamp(color.b * (1 - ratio)),
  };
}

export interface AccentShades {
  gold: string;
  gold600: string;
  gold400: string;
  forest: string;
  forest600: string;
}

/**
 * Dérive les cinq nuances du thème à partir d'une seule couleur d'accent.
 *
 * `gold-600` est la version foncée (survols, textes sur fond clair),
 * `gold-400` la version claire ; `forest` et `forest-600` forment le ton
 * secondaire profond, obtenu en assombrissant fortement l'accent — ce qui garde
 * l'ensemble harmonieux quelle que soit la teinte choisie.
 */
export function deriveAccentShades(accent: Rgb): AccentShades {
  return {
    gold: toRgbTriplet(accent),
    gold600: toRgbTriplet(darken(accent, 0.22)),
    gold400: toRgbTriplet(lighten(accent, 0.28)),
    forest: toRgbTriplet(darken(accent, 0.78)),
    forest600: toRgbTriplet(darken(accent, 0.6)),
  };
}

/**
 * Style inline à poser sur `<html>` quand la palette est personnalisée.
 * Renvoie `undefined` pour les palettes prêtes (gérées par `globals.css`) ou
 * si la couleur saisie est invalide — le site retombe alors sur l'ambre.
 */
export function buildPaletteStyle(
  palette: string | null | undefined,
  accentHex: string | null | undefined,
): Record<string, string> | undefined {
  if (resolvePaletteName(palette) !== "perso") return undefined;
  const accent = accentHex ? parseHex(accentHex) : null;
  if (!accent) return undefined;

  const nuances = deriveAccentShades(accent);
  return {
    "--color-gold": nuances.gold,
    "--color-gold-600": nuances.gold600,
    "--color-gold-400": nuances.gold400,
    "--color-forest": nuances.forest,
    "--color-forest-600": nuances.forest600,
  };
}
