/**
 * Types des « profils de seed » (stratégie multi-instance).
 *
 * Un profil décrit le contenu initial d'UN restaurant : identité, menu, zones,
 * horaires, réglages. Le lanceur générique `prisma/seed.ts` choisit le profil
 * via la variable d'environnement `SEED_PROFILE` (défaut : `anatolia-grill`).
 *
 * Deux stratégies de nettoyage (`resetStrategy`) :
 *  - `"demo"`     : comportement HISTORIQUE du seed de dev — désactive les autres
 *                   restaurants / plats / promos absents du profil (base de démo
 *                   propre). Réservé au profil de démonstration.
 *  - `"additive"` : upsert uniquement, ne désactive jamais rien. SÛR pour
 *                   provisionner un vrai restaurant sans risquer d'écraser des
 *                   données. C'est la valeur par défaut.
 */

export interface SeedCategory {
  slug: string;
  name: string;
  sortOrder: number;
  /** Accroche affichée sur la carte (éditable ensuite au CRM). */
  description?: string;
  /** Bannière de la catégorie (chemin `/images/…` ou `/media/…`). */
  image?: string;
  /** Défaut : visible. */
  active?: boolean;
}

export interface SeedDish {
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  /** Slug de la catégorie (doit exister dans `categories`). */
  category: string;
  tag?: string;
  sortOrder: number;
  /** Mis en avant : spécialités de l'accueil + badge « Populaire ». */
  featured?: boolean;
}

export interface SeedOption {
  name: string;
  priceDelta: number;
  sortOrder: number;
}

export interface SeedOptionGroup {
  /** Slug du plat auquel rattacher le groupe d'options. */
  dishSlug: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  sortOrder: number;
  options: SeedOption[];
}

export interface SeedDeliveryZone {
  postalCode: string;
  fee: number;
  minOrder: number;
}

export interface SeedOpeningHour {
  /** 0 = dimanche … 6 = samedi (comme JS `Date.getDay`). */
  dayOfWeek: number;
  openMinutes: number;
  closeMinutes: number;
}

export interface SeedOrdering {
  slotIntervalMin?: number;
  leadTimeMin?: number;
  capacityPerSlot?: number;
  /** Palette d'accent : ambre | terracotta | emeraude. */
  colorPalette?: "ambre" | "terracotta" | "emeraude";
}

/** Identité écrite dans le singleton `SiteSetting` (vide → fallback template). */
export interface SeedIdentity {
  name?: string;
  shortName?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  whatsappNumber?: string;
  telegramUsername?: string;
  hoursSummary?: string;
}

export interface SeedPromoCode {
  code: string;
  type: "percent" | "amount";
  value: number;
  active?: boolean;
}

/**
 * Fixtures de DÉMONSTRATION (stock du jour, précommande de saison, panier
 * anti-gaspi). À ne pas utiliser pour un vrai restaurant. Les fenêtres de
 * dates sont exprimées en décalage de jours par rapport au moment du seed.
 */
export interface SeedDemoFixtures {
  /** slug de plat -> stock du jour. */
  stock?: Record<string, number>;
  seasonal?: {
    slug: string;
    name: string;
    description: string;
    image: string;
    price: number;
    quota: number;
    salesStartOffsetDays: number;
    salesEndOffsetDays: number;
    pickupStartOffsetDays: number;
    pickupEndOffsetDays: number;
  };
  antiwaste?: {
    title: string;
    description: string;
    price: number;
    originalValue: number;
    quantity: number;
    pickupStart: string;
    pickupEnd: string;
  };
}

export interface SeedProfile {
  restaurant: { slug: string; name: string };
  identity?: SeedIdentity;
  ordering?: SeedOrdering;
  categories: SeedCategory[];
  dishes: SeedDish[];
  optionGroups?: SeedOptionGroup[];
  deliveryZones?: SeedDeliveryZone[];
  openingHours?: SeedOpeningHour[];
  promoCodes?: SeedPromoCode[];
  demo?: SeedDemoFixtures;
  /** Défaut : `"additive"` (non destructif). */
  resetStrategy?: "demo" | "additive";
}
