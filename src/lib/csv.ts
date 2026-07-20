/**
 * Helpers d'export CSV partagés — voir `csv.test.ts`.
 *
 * Framework-free / testable : pas de `server-only`, pas d'accès DB.
 * Utilisé par les routes `/api/admin/*.csv`.
 */

// Caractères qui, en tête de cellule, déclenchent l'évaluation d'une formule
// dans Excel / LibreOffice / Google Sheets (injection CSV / DDE).
const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Échappe une valeur pour une cellule CSV en neutralisant **aussi** l'injection
 * de formule : une cellule qui commence par `= + - @`, tab ou CR est préfixée
 * d'une apostrophe pour être traitée comme du texte par les tableurs.
 */
export function csvCell(
  value: string | number | boolean | null | undefined,
): string {
  let s = value == null ? "" : String(value);
  if (s.length > 0 && FORMULA_TRIGGERS.includes(s[0])) {
    s = `'${s}`;
  }
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Assemble une ligne CSV (séparateur `;`) en échappant chaque cellule. */
export function csvRow(
  values: Array<string | number | boolean | null | undefined>,
): string {
  return values.map(csvCell).join(";");
}
