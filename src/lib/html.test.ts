import { describe, expect, it } from "vitest";
import { escapeHtml, rawHtml, safeHtml, safeUrl } from "./html";

describe("escapeHtml", () => {
  it("échappe les caractères sensibles", () => {
    expect(escapeHtml('<script>"&\'')).toBe(
      "&lt;script&gt;&quot;&amp;&#39;",
    );
  });
});

describe("safeHtml", () => {
  it("échappe automatiquement les valeurs interpolées", () => {
    const name = "<b>x</b>";
    expect(safeHtml`<p>${name}</p>`).toBe("<p>&lt;b&gt;x&lt;/b&gt;</p>");
  });

  it("neutralise une tentative d'injection dans un email", () => {
    const msg = '<img src=x onerror="alert(1)">';
    const out = safeHtml`<p>${msg}</p>`;
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });

  it("n'échappe pas un fragment marqué rawHtml", () => {
    const inner = safeHtml`<li>${"<b>"}</li>`;
    const out = safeHtml`<ul>${rawHtml(inner)}</ul>`;
    expect(out).toBe("<ul><li>&lt;b&gt;</li></ul>");
  });

  it("rend une valeur nulle/indéfinie comme chaîne vide", () => {
    expect(safeHtml`a${null}b${undefined}c`).toBe("abc");
  });

  it("convertit les nombres", () => {
    expect(safeHtml`n=${42}`).toBe("n=42");
  });
});

describe("safeUrl", () => {
  it("laisse passer http/https/mailto", () => {
    expect(safeUrl("https://ex.com")).toBe("https://ex.com");
    expect(safeUrl("http://ex.com")).toBe("http://ex.com");
    expect(safeUrl("mailto:a@b.c")).toBe("mailto:a@b.c");
  });

  it("bloque javascript: et data:", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#");
    expect(safeUrl("data:text/html,<script>")).toBe("#");
  });

  it("renvoie # pour une URL invalide", () => {
    expect(safeUrl("pas une url")).toBe("#");
  });
});
