import { describe, expect, it } from "vitest";
import {
  CONTENT_SECTIONS,
  DEFAULT_CONTENT_BLOCKS,
  ICON_WHITELIST,
  SECTIONS_MARKDOWN,
  SECTION_LABELS,
  resolveIconName,
  resolveSection,
  resolveSingle,
} from "./content-blocks";

describe("DEFAULT_CONTENT_BLOCKS", () => {
  it("n'a aucune paire (section, clé) en double", () => {
    const cles = DEFAULT_CONTENT_BLOCKS.map((b) => `${b.section}/${b.key}`);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("ne référence que des sections déclarées", () => {
    const connues = new Set<string>(CONTENT_SECTIONS);
    for (const bloc of DEFAULT_CONTENT_BLOCKS) {
      expect(connues.has(bloc.section)).toBe(true);
    }
  });

  it("n'utilise que des icônes de la liste blanche", () => {
    for (const bloc of DEFAULT_CONTENT_BLOCKS) {
      if (bloc.icon) expect(resolveIconName(bloc.icon)).toBe(bloc.icon);
    }
  });

  it("ne référence que des médias internes", () => {
    for (const bloc of DEFAULT_CONTENT_BLOCKS) {
      if (bloc.mediaUrl) expect(bloc.mediaUrl).toMatch(/^\/(images|videos)\//);
    }
  });

  it("donne un libellé à chaque section", () => {
    for (const section of CONTENT_SECTIONS) {
      expect(SECTION_LABELS[section]).toBeTruthy();
    }
  });

  it("fournit au moins un bloc à CHAQUE section déclarée", () => {
    // Une section sans bloc s'afficherait comme un onglet vide dans le CRM :
    // le restaurateur n'aurait aucun formulaire pour la renseigner.
    for (const section of CONTENT_SECTIONS) {
      expect(resolveSection(section, []).length).toBeGreaterThan(0);
    }
  });

  it("ne déclare comme Markdown que des sections existantes", () => {
    for (const section of SECTIONS_MARKDOWN) {
      expect(CONTENT_SECTIONS).toContain(section);
    }
  });

  it("fournit bien le contenu d'origine des sections migrées", () => {
    expect(resolveSection("hero")).toHaveLength(7);
    expect(resolveSection("galerie")).toHaveLength(11);
    expect(resolveSection("menu-hero")).toHaveLength(4);
    expect(resolveSection("etapes")).toHaveLength(3);
    expect(resolveSection("raccourcis")).toHaveLength(3);
  });
});

describe("resolveSection", () => {
  it("renvoie les défauts quand la base est vide", () => {
    const blocs = resolveSection("etapes", []);
    expect(blocs.map((b) => b.title)).toEqual([
      "Choisissez",
      "Validez",
      "Récupérez",
    ]);
  });

  it("laisse la ligne en base faire autorité sur le bloc correspondant", () => {
    const blocs = resolveSection("etapes", [
      { section: "etapes", key: "choisir", title: "Composez votre plateau" },
    ]);
    expect(blocs[0].title).toBe("Composez votre plateau");
    // Les autres blocs restent ceux du template.
    expect(blocs[1].title).toBe("Validez");
  });

  it("permet de vider un champ une fois le bloc repris en main", () => {
    const blocs = resolveSection("etapes", [
      { section: "etapes", key: "choisir", title: "Choisissez", body: "" },
    ]);
    expect(blocs[0].body).toBeUndefined();
  });

  it("retire les blocs désactivés", () => {
    const blocs = resolveSection("etapes", [
      { section: "etapes", key: "valider", active: false },
    ]);
    expect(blocs.map((b) => b.key)).toEqual(["choisir", "recuperer"]);
  });

  it("respecte l'ordre d'affichage choisi au CRM", () => {
    const blocs = resolveSection("etapes", [
      { section: "etapes", key: "recuperer", sortOrder: 0 },
    ]);
    expect(blocs[0].key).toBe("recuperer");
  });

  it("ajoute à la fin les blocs créés depuis le CRM", () => {
    const blocs = resolveSection("etapes", [
      { section: "etapes", key: "sur-place", title: "Dégustez sur place" },
    ]);
    expect(blocs).toHaveLength(4);
    expect(blocs[3].title).toBe("Dégustez sur place");
  });

  it("ignore les lignes d'une autre section", () => {
    const blocs = resolveSection("etapes", [
      { section: "galerie", key: "yassa", title: "Ne doit pas apparaître" },
    ]);
    expect(blocs.map((b) => b.title)).toEqual([
      "Choisissez",
      "Validez",
      "Récupérez",
    ]);
  });

  it("renvoie une liste vide pour une section inconnue", () => {
    expect(resolveSection("section-inexistante", [])).toEqual([]);
  });

  it("conserve les champs libres (data)", () => {
    const blocs = resolveSection("galerie", [
      { section: "galerie", key: "yassa", data: { tag: "Signature" } },
    ]);
    expect(blocs.find((b) => b.key === "yassa")?.data).toEqual({
      tag: "Signature",
    });
  });
});

describe("resolveSingle", () => {
  it("renvoie le premier bloc actif de la section", () => {
    expect(resolveSingle("a-propos", [])?.key).toBe("texte");
  });

  it("renvoie undefined si tout est désactivé", () => {
    const rows = DEFAULT_CONTENT_BLOCKS.filter(
      (b) => b.section === "a-propos",
    ).map((b) => ({ section: b.section, key: b.key, active: false }));
    expect(resolveSingle("a-propos", rows)).toBeUndefined();
  });
});

describe("resolveIconName", () => {
  it("accepte une icône de la liste blanche", () => {
    expect(resolveIconName("Truck")).toBe("Truck");
  });

  it("refuse tout nom inconnu", () => {
    expect(resolveIconName("PasUneIcone")).toBeUndefined();
    expect(resolveIconName("")).toBeUndefined();
    expect(resolveIconName(null)).toBeUndefined();
    expect(resolveIconName("constructor")).toBeUndefined();
  });

  it("expose une liste blanche non vide", () => {
    expect(ICON_WHITELIST.length).toBeGreaterThan(0);
  });
});
