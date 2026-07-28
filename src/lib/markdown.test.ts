import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown — structure", () => {
  it("rend les paragraphes séparés par une ligne vide", () => {
    expect(renderMarkdown("Bonjour.\n\nAu revoir.")).toBe(
      "<p>Bonjour.</p>\n<p>Au revoir.</p>",
    );
  });

  it("regroupe les lignes consécutives dans un même paragraphe", () => {
    expect(renderMarkdown("Une phrase\nqui continue.")).toBe(
      "<p>Une phrase qui continue.</p>",
    );
  });

  it("rend les titres de niveau 2 à 4", () => {
    expect(renderMarkdown("## Éditeur\n### Hébergeur")).toBe(
      "<h2>Éditeur</h2>\n<h3>Hébergeur</h3>",
    );
  });

  it("rend une liste à puces et la referme", () => {
    expect(renderMarkdown("- SIRET\n- TVA\n\nSuite.")).toBe(
      "<ul>\n<li>SIRET</li>\n<li>TVA</li>\n</ul>\n<p>Suite.</p>",
    );
  });

  it("renvoie une chaîne vide pour un contenu vide", () => {
    expect(renderMarkdown("")).toBe("");
    expect(renderMarkdown("   \n  ")).toBe("");
  });
});

describe("renderMarkdown — marques en ligne", () => {
  it("gère gras, italique et code", () => {
    expect(renderMarkdown("**gras** et *penché* et `code`")).toBe(
      "<p><strong>gras</strong> et <em>penché</em> et <code>code</code></p>",
    );
  });

  it("ne confond pas ** et *", () => {
    expect(renderMarkdown("**tout gras**")).toBe(
      "<p><strong>tout gras</strong></p>",
    );
  });

  it("rend les liens internes et externes", () => {
    expect(renderMarkdown("[Contact](/contact)")).toBe(
      '<p><a href="/contact" rel="noopener">Contact</a></p>',
    );
    expect(renderMarkdown("[Site](https://exemple.test)")).toBe(
      '<p><a href="https://exemple.test" rel="noopener">Site</a></p>',
    );
    expect(renderMarkdown("[Avis](#avis-clients)")).toBe(
      '<p><a href="#avis-clients" rel="noopener">Avis</a></p>',
    );
  });
});

describe("renderMarkdown — sûreté", () => {
  it("neutralise le HTML brut saisi dans le CRM", () => {
    const rendu = renderMarkdown('<script>alert("xss")</script>');
    expect(rendu).not.toContain("<script");
    expect(rendu).toContain("&lt;script&gt;");
  });

  it("neutralise une balise img avec gestionnaire d'événement", () => {
    const rendu = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(rendu).not.toContain("<img");
    expect(rendu).not.toContain('onerror="');
  });

  it("refuse un lien javascript: et le rend en texte", () => {
    const rendu = renderMarkdown("[clique](javascript:alert(1))");
    expect(rendu).not.toContain("javascript:");
    expect(rendu).not.toContain("<a ");
    expect(rendu).toContain("clique");
  });

  it("refuse un lien data: et un lien protocole-relatif", () => {
    expect(renderMarkdown("[x](data:text/html;base64,PHN2Zz4=)")).not.toContain(
      "<a ",
    );
    expect(renderMarkdown("[x](//exemple.test/piege)")).not.toContain("<a ");
  });

  it("ne laisse pas sortir de guillemet non échappé dans un href", () => {
    // Le texte est échappé AVANT le rendu : impossible de casser l'attribut.
    const rendu = renderMarkdown('[x](/a" onmouseover="alert(1))');
    expect(rendu).not.toContain('onmouseover="alert');
  });

  it("préserve les caractères français et la ponctuation", () => {
    expect(renderMarkdown("Crème brûlée & thé — à 5 €")).toBe(
      "<p>Crème brûlée &amp; thé — à 5 €</p>",
    );
  });
});
