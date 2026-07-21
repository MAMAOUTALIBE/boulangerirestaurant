/**
 * Profil de seed « blank » — squelette d'un NOUVEAU restaurant.
 *
 * Non destructif (`resetStrategy: "additive"`) : uniquement des upserts, ne
 * désactive rien. Crée le strict nécessaire pour un site fonctionnel puis
 * laisse tout se régler depuis le CRM :
 *   - identité, couleurs → /admin/parametres
 *   - menu (catégories + plats) → /admin/menu
 *   - horaires, zones de livraison → /admin
 *
 * Pour créer un restaurant : copier ce fichier en `prisma/seeds/<slug>.ts`,
 * enregistrer le slug + un `name`, éventuellement pré-remplir identité et menu,
 * puis l'ajouter au registre `PROFILES` dans `prisma/seed.ts`.
 */
import type { SeedProfile } from "./types";

const blank: SeedProfile = {
  // ⚠️ Remplace `slug`/`name` par ceux du restaurant, et fais-les correspondre
  // à DEFAULT_RESTAURANT_SLUG dans le .env distant.
  restaurant: { slug: "nouveau-restaurant", name: "Nouveau restaurant" },
  resetStrategy: "additive",

  // Identité minimale (le reste se règle dans /admin/parametres).
  identity: {
    name: "Nouveau restaurant",
    shortName: "Restaurant",
  },

  ordering: {
    slotIntervalMin: 15,
    leadTimeMin: 20,
    capacityPerSlot: 8,
    colorPalette: "ambre",
  },

  // Catégories génériques de départ (éditables/supprimables dans /admin/menu).
  // Aucun plat : le restaurant construit sa carte depuis le CRM.
  categories: [
    { slug: "entrees", name: "Entrées", sortOrder: 1 },
    { slug: "plats", name: "Plats", sortOrder: 2 },
    { slug: "desserts", name: "Desserts", sortOrder: 3 },
    { slug: "boissons", name: "Boissons", sortOrder: 4 },
  ],
  dishes: [],

  // Ouvert tous les jours 11h30–23h00 par défaut (ajustable dans le CRM).
  openingHours: Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    openMinutes: 11 * 60 + 30,
    closeMinutes: 23 * 60,
  })),
};

export default blank;
