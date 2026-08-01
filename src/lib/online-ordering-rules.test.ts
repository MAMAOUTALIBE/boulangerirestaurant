import { describe, expect, it } from "vitest";
import { resolveOnlineOrderingEnabled } from "./online-ordering-rules";

describe("resolveOnlineOrderingEnabled", () => {
  it("reste désactivé sans réglage explicite", () => {
    expect(resolveOnlineOrderingEnabled(undefined)).toBe(false);
    expect(resolveOnlineOrderingEnabled(null)).toBe(false);
    expect(resolveOnlineOrderingEnabled(false)).toBe(false);
  });

  it("n'autorise les commandes que pour la valeur vraie explicite", () => {
    expect(resolveOnlineOrderingEnabled(true)).toBe(true);
  });
});
