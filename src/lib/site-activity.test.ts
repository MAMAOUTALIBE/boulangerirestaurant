import { describe, expect, it } from "vitest";
import {
  aggregateTesters,
  filterTesters,
  normalizePhone,
  type TesterActivity,
} from "@/lib/site-activity";

function activity(partial: Partial<TesterActivity>): TesterActivity {
  return {
    kind: "lead",
    ref: "ref",
    channel: "Contact",
    at: 0,
    ...partial,
  };
}

describe("normalizePhone", () => {
  it("ignore la mise en forme pour comparer deux saisies du même numéro", () => {
    expect(normalizePhone("07 75 78 78 25")).toBe(normalizePhone("0775787825"));
  });

  it("rejette les numéros trop courts", () => {
    expect(normalizePhone("123")).toBeUndefined();
  });
});

describe("aggregateTesters", () => {
  it("fusionne un lead et une commande partageant le téléphone", () => {
    const profiles = aggregateTesters([
      activity({
        kind: "lead",
        channel: "Contact",
        email: "test@ex.fr",
        phone: "07 75 78 78 25",
        at: 100,
      }),
      activity({
        kind: "commande",
        ref: "NK-1",
        channel: "Commande (emporter)",
        phone: "0775787825",
        status: "payée",
        total: 24.5,
        at: 200,
      }),
    ]);

    expect(profiles).toHaveLength(1);
    const [p] = profiles;
    expect(p.email).toBe("test@ex.fr");
    expect(p.stage).toBe("commande");
    expect(p.counts.orders).toBe(1);
    expect(p.totalOrdered).toBe(24.5);
    expect(p.lastStatus).toBe("payée");
  });

  it("garde un panier anonyme comme profil isolé", () => {
    const profiles = aggregateTesters([
      activity({ kind: "panier", ref: "cart-xyz", channel: "Panier", at: 50 }),
    ]);

    expect(profiles).toHaveLength(1);
    expect(profiles[0].anonymous).toBe(true);
    expect(profiles[0].stage).toBe("panier");
  });

  it("compte les statuts et exclut les commandes annulées du total", () => {
    const profiles = aggregateTesters([
      activity({
        kind: "commande",
        email: "a@b.fr",
        channel: "Commande",
        status: "en attente",
        total: 10,
        at: 1,
      }),
      activity({
        kind: "commande",
        email: "a@b.fr",
        channel: "Commande",
        status: "annulée",
        total: 99,
        at: 2,
      }),
      activity({
        kind: "commande",
        email: "a@b.fr",
        channel: "Commande",
        status: "livrée",
        total: 15,
        at: 3,
      }),
    ]);

    const [p] = profiles;
    expect(p.counts.orders).toBe(3);
    expect(p.counts.ordersPending).toBe(1);
    expect(p.counts.ordersCanceled).toBe(1);
    expect(p.counts.ordersPaid).toBe(1);
    expect(p.totalOrdered).toBe(25);
  });

  it("trie les profils du plus récent au plus ancien", () => {
    const profiles = aggregateTesters([
      activity({ email: "old@ex.fr", at: 100 }),
      activity({ email: "new@ex.fr", at: 500 }),
    ]);

    expect(profiles.map((p) => p.email)).toEqual(["new@ex.fr", "old@ex.fr"]);
  });
});

describe("filterTesters", () => {
  const profiles = aggregateTesters([
    activity({ kind: "panier", ref: "cart-1", channel: "Panier", at: 10 }),
    activity({
      kind: "commande",
      email: "client@ex.fr",
      channel: "Commande",
      status: "payée",
      at: 20,
    }),
  ]);

  it("filtre par étape atteinte", () => {
    expect(filterTesters(profiles, { stage: "commande" })).toHaveLength(1);
    expect(filterTesters(profiles, { stage: "panier" })).toHaveLength(1);
  });

  it("ignore une étape invalide", () => {
    expect(filterTesters(profiles, { stage: "n-importe-quoi" })).toHaveLength(
      profiles.length,
    );
  });

  it("recherche sur email et références", () => {
    expect(filterTesters(profiles, { q: "client@ex" })).toHaveLength(1);
    expect(filterTesters(profiles, { q: "cart-1" })).toHaveLength(1);
    expect(filterTesters(profiles, { q: "introuvable" })).toHaveLength(0);
  });
});
