import { getContentBlock } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";

/**
 * Corps d'une page légale.
 *
 * Tant que le restaurateur n'a rien saisi dans /admin/contenus, on affiche le
 * texte modèle livré avec le site (`children`). Dès qu'il rédige sa version,
 * elle prend la main — écrite en Markdown, rendue par `renderMarkdown`, qui
 * échappe tout le HTML avant de réinjecter les seules balises autorisées : un
 * `<script>` collé dans le CRM ressort en texte, jamais en script.
 */
export async function LegalContent({
  section,
  children,
}: {
  section: string;
  children: React.ReactNode;
}) {
  const bloc = await getContentBlock(section);
  if (!bloc?.body) return <>{children}</>;

  return (
    <div
      className="[&_h2]:mt-8 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-cream [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:space-y-1"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(bloc.body) }}
    />
  );
}
