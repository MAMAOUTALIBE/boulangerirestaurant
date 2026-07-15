/** Convertit un montant en euros vers des centimes, sans dérive flottante. */
export function amountInCents(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Montant de paiement invalide.");
  }
  return Math.round(amount * 100);
}

interface CheckoutPaymentSnapshot {
  amountTotal: number | null;
  currency: string | null;
  paymentStatus: string;
}

/** Vérifie que Stripe confirme exactement le montant et la devise attendus. */
export function isExpectedStripePayment(
  snapshot: CheckoutPaymentSnapshot,
  expectedTotal: number,
  expectedCurrency: string,
): boolean {
  return (
    snapshot.paymentStatus === "paid" &&
    snapshot.amountTotal === amountInCents(expectedTotal) &&
    snapshot.currency?.toLowerCase() === expectedCurrency.toLowerCase()
  );
}
