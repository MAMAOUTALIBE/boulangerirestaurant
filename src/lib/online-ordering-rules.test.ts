import { describe, expect, it } from "vitest";
import {
  canCreateOnlineOrder,
  canPayOnline,
  resolveOrderingMode,
} from "./online-ordering-rules";

describe("règles des modes de commande", () => {
  it("retombe en mode vitrine sans valeur explicitement valide", () => {
    expect(resolveOrderingMode(undefined)).toBe("vitrine");
    expect(resolveOrderingMode(null)).toBe("vitrine");
    expect(resolveOrderingMode("inconnu")).toBe("vitrine");
  });

  it("autorise la création sans autoriser le paiement en mode sur place", () => {
    expect(canCreateOnlineOrder("paiement_sur_place")).toBe(true);
    expect(canPayOnline("paiement_sur_place")).toBe(false);
  });

  it("réserve le paiement en ligne au mode complet", () => {
    expect(canCreateOnlineOrder("vitrine")).toBe(false);
    expect(canPayOnline("vitrine")).toBe(false);
    expect(canCreateOnlineOrder("paiement_en_ligne")).toBe(true);
    expect(canPayOnline("paiement_en_ligne")).toBe(true);
  });
});
