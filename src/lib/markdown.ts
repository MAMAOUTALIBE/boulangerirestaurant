/**
 * Rendu Markdown minimal — pur / testable (pas de `server-only`, pas de DB).
 *
 * Sert aux textes longs éditables depuis le CRM : pages légales, présentations,
 * accroches. Volontairement écrit à la main plutôt que d'ajouter une dépendance :
 * le besoin tient en six constructions, et surtout la sécurité est structurelle.
 *
 * ⚠️ Principe de sûreté : le texte est **intégralement échappé d'abord**
 * (`escapeHtml`), puis les balises autorisées sont réinjectées. Il n'existe donc
 * aucun chemin par lequel du HTML saisi dans le CRM atteint la page — un
 * `<script>` collé dans une page légale ressort en texte visible, pas en script.
 * Les liens passent par `safeUrl` : un `javascript:` devient `#`.
 */
import { escapeHtml, safeUrl } from "@/lib/html";

/**
 * Résout la cible d'un lien Markdown.
 * - chemin interne (`/contact`, `#avis`) : accepté tel quel ;
 * - URL absolue : filtrée par `safeUrl` (http/https/mailto uniquement) ;
 * - tout le reste (`javascript:`, `data:`, `//evil.test`) : refusé → `null`,
 *   et le lien est alors rendu comme du texte simple.
 */
function resolveHref(url: string): string | null {
  if (url.startsWith("//")) return null; // protocole-relatif = domaine tiers
  if (url.startsWith("/") || url.startsWith("#")) return url;
  const filtre = safeUrl(url);
  return filtre === "#" ? null : filtre;
}

/** Applique les marques en ligne (gras, italique, code, liens). */
function renderInline(texte: string): string {
  return (
    texte
      // Liens [libellé](url) — l'URL est filtrée sur son schéma.
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, libelle, url) => {
        const href = resolveHref(url);
        return href
          ? `<a href="${href}" rel="noopener">${libelle}</a>`
          : libelle;
      })
      // Gras puis italique (l'ordre évite que `*` mange `**`).
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
  );
}

/**
 * Convertit du Markdown en HTML sûr.
 *
 * Constructions gérées : titres `##`/`###`, listes `-`, paragraphes, gras,
 * italique, code en ligne, liens. Tout le reste est rendu littéralement.
 */
export function renderMarkdown(source: string): string {
  if (!source?.trim()) return "";

  const lignes = escapeHtml(source).replace(/\r\n/g, "\n").split("\n");
  const sortie: string[] = [];
  let listeOuverte = false;
  let paragraphe: string[] = [];

  const viderParagraphe = () => {
    if (paragraphe.length > 0) {
      sortie.push(`<p>${renderInline(paragraphe.join(" "))}</p>`);
      paragraphe = [];
    }
  };
  const fermerListe = () => {
    if (listeOuverte) {
      sortie.push("</ul>");
      listeOuverte = false;
    }
  };

  for (const ligne of lignes) {
    const texte = ligne.trim();

    if (!texte) {
      viderParagraphe();
      fermerListe();
      continue;
    }

    const titre = /^(#{2,4})\s+(.*)$/.exec(texte);
    if (titre) {
      viderParagraphe();
      fermerListe();
      const niveau = titre[1].length;
      sortie.push(`<h${niveau}>${renderInline(titre[2])}</h${niveau}>`);
      continue;
    }

    const puce = /^[-*]\s+(.*)$/.exec(texte);
    if (puce) {
      viderParagraphe();
      if (!listeOuverte) {
        sortie.push("<ul>");
        listeOuverte = true;
      }
      sortie.push(`<li>${renderInline(puce[1])}</li>`);
      continue;
    }

    fermerListe();
    paragraphe.push(texte);
  }

  viderParagraphe();
  fermerListe();
  return sortie.join("\n");
}
