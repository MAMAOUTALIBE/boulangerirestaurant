/**
 * Helpers d'échappement HTML pour les emails transactionnels — voir `html.test.ts`.
 *
 * Framework-free / testable (pas de `server-only`, pas de DB). Centralise ce qui
 * était dupliqué dans `actions.ts`, `orders.ts` et `marketing-automation.ts`.
 */

/** Échappe les caractères HTML sensibles d'une valeur texte. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Marque un fragment déjà sûr pour l'interpoler dans `safeHtml` sans le ré-échapper. */
export class SafeFragment {
  constructor(readonly value: string) {}
}

/** Emballe un fragment HTML déjà construit avec `safeHtml` (évite le double échappement). */
export function rawHtml(value: string): SafeFragment {
  return new SafeFragment(value);
}

/**
 * Template littéral qui échappe **automatiquement** toute valeur interpolée —
 * le vecteur d'injection HTML des emails admin alimentés par des champs publics.
 * Un fragment déjà construit avec `safeHtml` doit passer par `rawHtml(...)`.
 * Tout nouveau champ interpolé est échappé par défaut (pas d'oubli possible).
 */
export function safeHtml(
  strings: TemplateStringsArray,
  ...values: Array<string | number | SafeFragment | null | undefined>
): string {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    out +=
      v instanceof SafeFragment
        ? v.value
        : v == null
          ? ""
          : escapeHtml(String(v));
    out += strings[i + 1];
  }
  return out;
}

/**
 * Ne renvoie l'URL que si son schéma est http(s)/mailto — sinon `#`.
 * Empêche un `javascript:`/`data:` (accepté par `z.string().url()`) d'atterrir
 * dans un `href` d'email envoyé à l'admin.
 */
export function safeUrl(value: string): string {
  try {
    const scheme = new URL(value).protocol;
    return ["http:", "https:", "mailto:"].includes(scheme) ? value : "#";
  } catch {
    return "#";
  }
}
