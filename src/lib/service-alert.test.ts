import { describe, it, expect } from "vitest";
import { computeServiceAlert } from "@/lib/service-alert";

const TH = { imminentMin: 5, prepMaxMin: 10, stageMaxMin: 5 };
const now = 1_000_000_000_000;
const min = (n: number) => n * 60000;

describe("computeServiceAlert", () => {
  it("ok quand l'échéance est loin et le statut récent", () => {
    const r = computeServiceAlert(
      {
        status: "payée",
        dueAtMs: now + min(30),
        enteredAtMs: now - min(1),
        nowMs: now,
      },
      TH,
    );
    expect(r.level).toBe("ok");
  });

  it("imminent à moins de 5 min de l'échéance", () => {
    const r = computeServiceAlert(
      {
        status: "payée",
        dueAtMs: now + min(3),
        enteredAtMs: now - min(1),
        nowMs: now,
      },
      TH,
    );
    expect(r.level).toBe("imminent");
  });

  it("late quand l'échéance est dépassée et pas prêt", () => {
    const r = computeServiceAlert(
      {
        status: "en préparation",
        dueAtMs: now - min(2),
        enteredAtMs: now - min(1),
        nowMs: now,
      },
      TH,
    );
    expect(r.level).toBe("late");
    expect(r.minsLate).toBe(2);
  });

  it("stagnant si trop longtemps en préparation (>10 min)", () => {
    const r = computeServiceAlert(
      {
        status: "en préparation",
        dueAtMs: now + min(60),
        enteredAtMs: now - min(12),
        nowMs: now,
      },
      TH,
    );
    expect(r.level).toBe("stagnant");
    expect(r.minsInStatus).toBe(12);
  });

  it("stagnant si une commande prête traîne (>5 min)", () => {
    const r = computeServiceAlert(
      {
        status: "prête",
        dueAtMs: now - min(1),
        enteredAtMs: now - min(6),
        nowMs: now,
      },
      TH,
    );
    expect(r.level).toBe("stagnant");
  });
});
