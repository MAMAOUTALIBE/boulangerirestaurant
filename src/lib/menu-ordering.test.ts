import { describe, expect, it } from "vitest";
import { applyReorder, planReorder, type OrderableRow } from "./menu-ordering";

/** Raccourci : « a(2) > b(3) » → lignes triées prêtes pour `planReorder`. */
function liste(...entrees: [string, number][]): OrderableRow[] {
  return entrees.map(([id, sortOrder]) => ({ id, sortOrder }));
}

/** Ordre lisible après application du plan. */
function ordre(
  rows: OrderableRow[],
  plan = [] as ReturnType<typeof planReorder>,
) {
  return applyReorder(rows, plan)
    .map((r) => r.id)
    .join(" > ");
}

describe("planReorder", () => {
  it("monte un élément d'un seul cran", () => {
    const rows = liste(["a", 1], ["b", 2], ["c", 3]);
    expect(ordre(rows, planReorder(rows, "c", "up"))).toBe("a > c > b");
  });

  it("descend un élément d'un seul cran", () => {
    const rows = liste(["a", 1], ["b", 2], ["c", 3]);
    expect(ordre(rows, planReorder(rows, "a", "down"))).toBe("b > a > c");
  });

  it("ne fait rien en haut ou en bas de liste", () => {
    const rows = liste(["a", 1], ["b", 2]);
    expect(planReorder(rows, "a", "up")).toEqual([]);
    expect(planReorder(rows, "b", "down")).toEqual([]);
  });

  it("ignore un identifiant inconnu", () => {
    expect(planReorder(liste(["a", 1]), "zzz", "up")).toEqual([]);
  });

  it("ne déplace QUE d'un cran quand les ordres sont sur une autre échelle", () => {
    // Le bug d'origine : après suppression de la 1re catégorie, les ordres
    // restants valent 2..5. Monter « desserts » l'envoyait en tête de carte
    // parce que seules deux lignes étaient réécrites, avec des rangs 0-based.
    const rows = liste(
      ["plats", 2],
      ["grillades", 3],
      ["desserts", 4],
      ["boissons", 5],
    );
    expect(ordre(rows, planReorder(rows, "desserts", "up"))).toBe(
      "plats > desserts > grillades > boissons",
    );
  });

  it("départage proprement des ordres en doublon", () => {
    // Cas créé par la duplication d'un plat (sortOrder + 1 déjà pris).
    const rows = liste(["a", 1], ["b", 2], ["c", 2], ["d", 3]);
    expect(ordre(rows, planReorder(rows, "d", "up"))).toBe("a > b > d > c");
  });

  it("produit une numérotation dense commençant à 1", () => {
    const rows = liste(["a", 10], ["b", 20], ["c", 30]);
    const plan = planReorder(rows, "c", "up");
    expect(applyReorder(rows, plan).map((r) => r.sortOrder)).toEqual([1, 2, 3]);
  });

  it("n'écrit que les lignes réellement modifiées", () => {
    // Liste déjà dense en 1..4 : monter « c » ne touche que c et b.
    const rows = liste(["a", 1], ["b", 2], ["c", 3], ["d", 4]);
    const plan = planReorder(rows, "c", "up");
    expect(plan.map((p) => p.id).sort()).toEqual(["b", "c"]);
  });

  it("reste stable après plusieurs déplacements successifs", () => {
    let rows = liste(["a", 2], ["b", 7], ["c", 7], ["d", 99]);
    for (const id of ["d", "d", "d"]) {
      rows = applyReorder(rows, planReorder(rows, id, "up"));
    }
    expect(rows.map((r) => r.id).join(" > ")).toBe("d > a > b > c");
    expect(rows.map((r) => r.sortOrder)).toEqual([1, 2, 3, 4]);
  });
});
