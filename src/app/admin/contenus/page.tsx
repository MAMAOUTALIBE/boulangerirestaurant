import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, RotateCcw } from "lucide-react";
import {
  adminMoveContentBlock,
  adminResetContentBlock,
  adminSaveContentBlock,
} from "@/app/actions";
import {
  CONTENT_SECTIONS,
  ICON_WHITELIST,
  SECTIONS_MARKDOWN,
  SECTION_LABELS,
  blockText,
  resolveSection,
  type ContentSection,
} from "@/lib/content-blocks";
import { getContentRows } from "@/lib/content";
import { MediaPicker } from "@/components/admin/MediaPicker";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none";
const boutonPrimaire =
  "rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400";
const boutonDiscret =
  "rounded-lg border border-white/10 px-2 py-1 text-xs text-cream/70 transition hover:border-white/25 hover:text-cream";
const SECTIONS_AVEC_AFFICHE_VIDEO: ContentSection[] = [
  "hero",
  "menu-hero",
  "galerie",
];

/** Page publique où chaque section se voit (bouton « voir sur le site »). */
const APERCU: Partial<Record<ContentSection, string>> = {
  hero: "/",
  "menu-hero": "/menu",
  galerie: "/galerie",
  "a-propos": "/#a-propos",
  "a-propos-points": "/#a-propos",
  etapes: "/",
  "infos-pratiques": "/",
  "qr-avantages": "/",
  raccourcis: "/",
  "footer-atouts": "/",
  "page-cgv": "/cgv",
  "page-mentions-legales": "/mentions-legales",
  "page-confidentialite": "/confidentialite",
};

export default async function AdminContenusPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; saved?: string; error?: string }>;
}) {
  const [rows, params] = await Promise.all([getContentRows(), searchParams]);

  const section = (
    CONTENT_SECTIONS.includes(params.section as ContentSection)
      ? params.section
      : CONTENT_SECTIONS[0]
  ) as ContentSection;

  // On affiche aussi les blocs désactivés : le CRM doit permettre de les
  // réactiver, alors que le site public ne les rend pas.
  const personnalises = new Set(
    rows.filter((r) => r.section === section).map((r) => r.key),
  );
  const blocs = resolveSection(section, rows);
  const masques = rows
    .filter((r) => r.section === section && r.active === false)
    .map((r) => r.key);
  const tousLesBlocs = [
    ...blocs,
    ...resolveSection(
      section,
      rows.map((r) => (masques.includes(r.key) ? { ...r, active: true } : r)),
    ).filter((b) => masques.includes(b.key)),
  ];

  const estMarkdown = SECTIONS_MARKDOWN.includes(section);
  const apercu = APERCU[section];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">Contenus</h1>
        <p className="mt-1 text-sm text-muted">
          Textes, photos et libellés du site public. Un bloc non modifié affiche
          le contenu d&apos;origine ; dès que vous l&apos;enregistrez, votre
          version prend la main.
        </p>
      </div>

      {params.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {params.error === "media"
            ? "Image refusée : choisissez-la dans la médiathèque."
            : "Enregistrement refusé."}
        </p>
      )}
      {params.saved && (
        <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {params.saved === "reset"
            ? "Bloc réinitialisé au contenu d'origine."
            : "Contenu enregistré."}
        </p>
      )}

      {/* Navigation entre sections */}
      <nav className="flex flex-wrap gap-2">
        {CONTENT_SECTIONS.map((s) => (
          <Link
            key={s}
            href={`/admin/contenus?section=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              s === section
                ? "bg-gold text-ink"
                : "border border-white/10 text-cream/70 hover:border-white/25 hover:text-cream"
            }`}
          >
            {SECTION_LABELS[s]}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-semibold text-cream">
          {SECTION_LABELS[section]}
        </h2>
        {apercu && (
          <a
            href={apercu}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            voir sur le site
          </a>
        )}
      </div>

      {section === "hero" && (
        <div className="rounded-2xl border border-gold/25 bg-gold/5 p-4 text-sm text-cream/80">
          <p className="font-semibold text-gold">Gérer les slides du hero</p>
          <p className="mt-1 leading-6">
            Dans chaque slide, cliquez sur « Choisir ou téléverser » pour
            envoyer une photo ou une vidéo depuis votre appareil. Vous pouvez
            ensuite modifier son titre, la masquer ou changer son ordre avec les
            flèches.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {tousLesBlocs.map((bloc, index) => {
          const personnalise = personnalises.has(bloc.key);
          const desactive = masques.includes(bloc.key);
          return (
            <div
              key={bloc.key}
              className={`rounded-2xl border p-5 ${
                desactive
                  ? "border-white/5 bg-ink-soft/50"
                  : "border-white/10 bg-ink-soft"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted">{bloc.key}</span>
                {personnalise ? (
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[0.7rem] text-gold">
                    personnalisé
                  </span>
                ) : (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.7rem] text-muted">
                    contenu d&apos;origine
                  </span>
                )}
                {desactive && (
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[0.7rem] text-red-300">
                    masqué
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {!estMarkdown && (
                    <>
                      <form action={adminMoveContentBlock}>
                        <input type="hidden" name="section" value={section} />
                        <input type="hidden" name="key" value={bloc.key} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          className={boutonDiscret}
                          disabled={index === 0}
                          title="Monter"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                      </form>
                      <form action={adminMoveContentBlock}>
                        <input type="hidden" name="section" value={section} />
                        <input type="hidden" name="key" value={bloc.key} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          className={boutonDiscret}
                          disabled={index === tousLesBlocs.length - 1}
                          title="Descendre"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </>
                  )}
                  {personnalise && (
                    <form action={adminResetContentBlock}>
                      <input type="hidden" name="section" value={section} />
                      <input type="hidden" name="key" value={bloc.key} />
                      <button
                        className={boutonDiscret}
                        title="Revenir au contenu d'origine"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <form
                action={adminSaveContentBlock}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="section" value={section} />
                <input type="hidden" name="key" value={bloc.key} />
                <input type="hidden" name="sortOrder" value={bloc.sortOrder} />

                <input
                  name="title"
                  defaultValue={bloc.title ?? ""}
                  placeholder="Titre"
                  className={inputClass}
                />
                <input
                  name="subtitle"
                  defaultValue={bloc.subtitle ?? ""}
                  placeholder="Sur-titre (optionnel)"
                  className={inputClass}
                />

                <textarea
                  name="body"
                  defaultValue={bloc.body ?? ""}
                  rows={estMarkdown ? 18 : 3}
                  placeholder={
                    estMarkdown
                      ? "Texte de la page en Markdown :\n\n## Un titre\n\nUn paragraphe avec du **gras**, de l'*italique* et un [lien](/contact).\n\n- une puce\n- une autre"
                      : "Texte du bloc"
                  }
                  className={`${inputClass} font-mono sm:col-span-2`}
                />

                {estMarkdown && (
                  <p className="text-xs text-muted sm:col-span-2">
                    Mise en forme acceptée : <code>## Titre</code>,{" "}
                    <code>**gras**</code>, <code>*italique*</code>,{" "}
                    <code>- puce</code>, <code>[lien](/page)</code>. Le HTML
                    n&apos;est pas interprété. Laissez vide pour conserver le
                    texte modèle livré avec le site.
                  </p>
                )}

                {!estMarkdown && (
                  <>
                    <MediaPicker
                      name="mediaUrl"
                      label={
                        section === "hero"
                          ? "Photo ou vidéo du slide"
                          : "Image ou vidéo"
                      }
                      defaultValue={bloc.mediaUrl}
                      className="sm:col-span-2"
                    />
                    {SECTIONS_AVEC_AFFICHE_VIDEO.includes(section) ? (
                      <MediaPicker
                        name="posterUrl"
                        label="Affiche de la vidéo (optionnelle)"
                        defaultValue={bloc.posterUrl}
                        mediaKind="image"
                        className="sm:col-span-2"
                      />
                    ) : (
                      <input
                        type="hidden"
                        name="posterUrl"
                        value={bloc.posterUrl ?? ""}
                      />
                    )}
                    <input
                      name="alt"
                      defaultValue={bloc.alt ?? ""}
                      placeholder="Description de l'image (accessibilité)"
                      className={inputClass}
                    />
                    <input
                      name="tag"
                      defaultValue={blockText(bloc, "tag") ?? ""}
                      placeholder="Étiquette (galerie)"
                      className={inputClass}
                    />
                    <input
                      name="href"
                      defaultValue={bloc.href ?? ""}
                      placeholder="Lien (/commander, #contact…)"
                      className={inputClass}
                    />
                    <input
                      name="ctaLabel"
                      defaultValue={bloc.ctaLabel ?? ""}
                      placeholder="Libellé du bouton"
                      className={inputClass}
                    />
                    <select
                      name="icon"
                      defaultValue={bloc.icon ?? ""}
                      className={inputClass}
                    >
                      <option value="">— Icône —</option>
                      {ICON_WHITELIST.map((nom) => (
                        <option key={nom} value={nom}>
                          {nom}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <label className="flex items-center gap-2 text-sm text-cream/80">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={!desactive}
                    className="accent-gold"
                  />
                  Visible sur le site
                </label>

                <div className="flex items-end justify-end sm:col-span-2">
                  <button type="submit" className={boutonPrimaire}>
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
