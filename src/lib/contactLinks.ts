/**
 * Liens de contact dérivés (tel:, mailto:, Google Maps).
 *
 * Ils dépendent désormais de l'identité *dynamique* du site : appeler
 * `buildContactLinks(config)` avec la config obtenue via `getSiteConfig()`
 * (serveur) ou `useSiteConfig()` (client) — il n'existe plus de constantes
 * figées, car les coordonnées sont éditables depuis `/admin/parametres`.
 */
export { buildContactLinks } from "@/lib/config";
