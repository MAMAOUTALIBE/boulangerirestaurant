import { describe, expect, it } from "vitest";
import { amountInCents, isExpectedStripePayment } from "./payment-integrity";

describe("intégrité du paiement", () => {
  it("convertit les euros en centimes avec arrondi", () => {
    expect(amountInCents(24.9)).toBe(2490);
    expect(amountInCents(12.345)).toBe(1235);
  });

  it("refuse les montants invalides", () => {
    expect(() => amountInCents(-1)).toThrow();
    expect(() => amountInCents(Number.NaN)).toThrow();
  });

  it("accepte uniquement un paiement payé au montant et à la devise attendus", () => {
    const valid = { amountTotal: 2490, currency: "eur", paymentStatus: "paid" };
    expect(isExpectedStripePayment(valid, 24.9, "EUR")).toBe(true);
    expect(
      isExpectedStripePayment({ ...valid, amountTotal: 2390 }, 24.9, "EUR"),
    ).toBe(false);
    expect(
      isExpectedStripePayment(
        { ...valid, paymentStatus: "unpaid" },
        24.9,
        "EUR",
      ),
    ).toBe(false);
  });
});
