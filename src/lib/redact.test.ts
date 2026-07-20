import { describe, expect, it } from "vitest";
import { maskEmail, maskPhone } from "./redact";

describe("maskEmail", () => {
  it("masque le nom local en gardant le domaine", () => {
    expect(maskEmail("jean.dupont@ex.com")).toBe("j***@ex.com");
  });
  it("gère une entrée sans @", () => {
    expect(maskEmail("pasunemail")).toBe("***");
    expect(maskEmail("@ex.com")).toBe("***");
  });
});

describe("maskPhone", () => {
  it("ne garde que les 2 derniers chiffres", () => {
    expect(maskPhone("+33 6 12 34 56 89")).toBe("***89");
    expect(maskPhone("0612345689")).toBe("***89");
  });
  it("gère une entrée trop courte", () => {
    expect(maskPhone("")).toBe("***");
    expect(maskPhone("7")).toBe("***");
  });
});
