/**
 * Segmentation client basée sur le RFM (Récence / Fréquence / Montant).
 * Pur calcul — réutilisable côté serveur et dans les tests.
 */
export type Segment =
  | "VIP"
  | "Fidèle"
  | "Nouveau"
  | "Actif"
  | "À risque"
  | "Perdu"
  | "Prospect";

export const SEGMENTS: Segment[] = [
  "VIP",
  "Fidèle",
  "Nouveau",
  "Actif",
  "À risque",
  "Perdu",
  "Prospect",
];

export const segmentStyles: Record<Segment, string> = {
  VIP: "bg-gold/20 text-gold",
  Fidèle: "bg-green-500/15 text-green-300",
  Nouveau: "bg-blue-500/15 text-blue-300",
  Actif: "bg-white/10 text-cream",
  "À risque": "bg-orange-500/15 text-orange-300",
  Perdu: "bg-red-500/15 text-red-300",
  Prospect: "bg-white/5 text-muted",
};

export interface RfmInput {
  ordersCount: number;
  totalSpent: number;
  /** Jours depuis la dernière commande, ou null si jamais commandé. */
  daysSinceLastOrder: number | null;
}

/** Déduit le segment d'un client à partir de ses indicateurs RFM. */
export function computeSegment({
  ordersCount,
  totalSpent,
  daysSinceLastOrder,
}: RfmInput): Segment {
  if (ordersCount === 0 || daysSinceLastOrder === null) return "Prospect";
  if (daysSinceLastOrder > 90) return "Perdu";
  if (daysSinceLastOrder > 30) return "À risque";
  if (ordersCount >= 3 && totalSpent >= 100) return "VIP";
  if (ordersCount >= 3) return "Fidèle";
  if (ordersCount <= 1) return "Nouveau";
  return "Actif";
}

/** Indique si un segment mérite une relance commerciale. */
export function needsReengagement(segment: Segment): boolean {
  return segment === "À risque" || segment === "Perdu";
}

/** Nombre de jours entre une date ISO et maintenant. */
export function daysSince(iso: string | null, now: number): number | null {
  if (!iso) return null;
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}
