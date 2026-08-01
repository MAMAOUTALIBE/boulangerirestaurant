export const ORDERING_MODES = [
  "vitrine",
  "paiement_sur_place",
  "paiement_en_ligne",
] as const;

export type OrderingMode = (typeof ORDERING_MODES)[number];

/** Résolution fail-closed : toute valeur inconnue redevient le mode vitrine. */
export function resolveOrderingMode(value: unknown): OrderingMode {
  return typeof value === "string" &&
    ORDERING_MODES.includes(value as OrderingMode)
    ? (value as OrderingMode)
    : "vitrine";
}

export const canCreateOnlineOrder = (mode: OrderingMode) => mode !== "vitrine";
export const canPayOnline = (mode: OrderingMode) =>
  mode === "paiement_en_ligne";
