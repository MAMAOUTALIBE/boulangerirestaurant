import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind en gérant les conflits. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Arrondit un montant au centime — le seul point d'arrondi monétaire du projet.
 * Toute somme calculée passe par ici pour éviter la dérive des flottants
 * (0.1 + 0.2 = 0.30000000000000004 finirait en base et sur une facture).
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Formate un nombre en prix euros (ex: 15 -> "15,00 €"). */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

/**
 * Sérialise un objet pour une balise `<script type="application/ld+json">`.
 * `JSON.stringify` seul n'échappe pas `<`, donc un champ éditable en base
 * (identité du site, nom de plat…) contenant `</script><script>…` casserait
 * la balise → XSS stocké. On échappe `< > &` en séquences unicode : le JSON
 * reste valide et un breakout `</script>` devient impossible.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(
    /[<>&]/g,
    (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}
