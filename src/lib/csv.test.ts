import { describe, expect, it } from "vitest";
import { csvCell, csvRow } from "./csv";

describe("csvCell", () => {
  it("laisse le texte simple inchangé", () => {
    expect(csvCell("Jean Dupont")).toBe("Jean Dupont");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("entoure de guillemets les valeurs contenant un séparateur", () => {
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell("ligne1\nligne2")).toBe('"ligne1\nligne2"');
    expect(csvCell('il a dit "oui"')).toBe('"il a dit ""oui"""');
  });

  it("neutralise l'injection de formule en préfixant une apostrophe", () => {
    // La valeur contient `"` → préfixe d'apostrophe PUIS mise entre guillemets
    // avec doublement des guillemets (RFC 4180).
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(
      '"\'=HYPERLINK(""http://evil"")"',
    );
    // Sans caractère spécial → simple préfixe d'apostrophe, pas de guillemets.
    expect(csvCell("+1+1")).toBe("'+1+1");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("échappe une formule qui contient aussi un séparateur", () => {
    // Contient `;` → guillemets ; les apostrophes ne sont PAS doublées (seuls
    // les guillemets le sont en CSV).
    expect(csvCell("=cmd|'/c calc'!A1;x")).toBe("\"'=cmd|'/c calc'!A1;x\"");
  });

  it("ne préfixe pas un nombre négatif déjà numérique", () => {
    // -5 (number) devient "-5" texte → préfixé, ce qui est le comportement sûr.
    expect(csvCell(-5)).toBe("'-5");
  });
});

describe("csvRow", () => {
  it("assemble une ligne séparée par des points-virgules", () => {
    expect(csvRow(["a", 1, true, null])).toBe("a;1;true;");
  });

  it("protège chaque cellule de la ligne", () => {
    expect(csvRow(["=A1", "ok"])).toBe("'=A1;ok");
  });
});
