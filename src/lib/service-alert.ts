/**
 * Calcul d'alerte pour une commande sur l'écran Service (pur, testable).
 * Niveaux : ok < imminent < stagnant < late.
 */
export type AlertLevel = "ok" | "imminent" | "stagnant" | "late";

export interface AlertThresholds {
  imminentMin: number;
  prepMaxMin: number;
  stageMaxMin: number;
}

export interface AlertInput {
  status: string;
  /** Échéance (créneau choisi sinon création + temps de prépa), en ms. */
  dueAtMs: number;
  /** Entrée dans le statut courant (dernier événement), en ms. */
  enteredAtMs: number;
  nowMs: number;
}

export interface AlertResult {
  level: AlertLevel;
  /** Minutes de retard (>0 si en retard), arrondi. */
  minsLate: number;
  /** Minutes passées dans le statut courant. */
  minsInStatus: number;
  reason: string;
}

// Statuts encore « à traiter » (l'échéance compte tant que ce n'est pas prêt).
const ACTIVE = new Set(["en attente", "payée", "en préparation"]);

export function computeServiceAlert(
  input: AlertInput,
  th: AlertThresholds,
): AlertResult {
  const { status, dueAtMs, enteredAtMs, nowMs } = input;
  const minsLate = Math.floor((nowMs - dueAtMs) / 60000);
  const minsInStatus = Math.floor((nowMs - enteredAtMs) / 60000);

  const active = ACTIVE.has(status);
  const stageThreshold =
    status === "en préparation" ? th.prepMaxMin : th.stageMaxMin;

  // En retard : échéance dépassée et pas encore prêt.
  if (active && nowMs > dueAtMs) {
    return {
      level: "late",
      minsLate,
      minsInStatus,
      reason: `En retard de ${minsLate} min`,
    };
  }
  // Stagnation : trop longtemps dans la colonne courante.
  if (minsInStatus > stageThreshold) {
    return {
      level: "stagnant",
      minsLate,
      minsInStatus,
      reason: `Bloquée depuis ${minsInStatus} min`,
    };
  }
  // Imminent : échéance proche.
  if (active && dueAtMs - nowMs <= th.imminentMin * 60000) {
    return {
      level: "imminent",
      minsLate,
      minsInStatus,
      reason: "Échéance imminente",
    };
  }
  return { level: "ok", minsLate, minsInStatus, reason: "" };
}
