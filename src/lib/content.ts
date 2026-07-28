import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  resolveSection,
  resolveSingle,
  type ContentBlockData,
  type ContentBlockRow,
} from "@/lib/content-blocks";

/**
 * Lecture des contenus éditoriaux (moitié « base » du couple avec le module pur
 * `content-blocks.ts`).
 *
 * Dégradation gracieuse : si la table est vide ou la base injoignable, on
 * renvoie les valeurs par défaut du template. Une panne de base ne doit jamais
 * produire une page blanche — au pire le site affiche son contenu d'origine.
 */

/** Toutes les lignes personnalisées, mises en cache pour la durée du rendu. */
const loadRows = cache(async (): Promise<ContentBlockRow[]> => {
  return prisma.contentBlock
    .findMany({ orderBy: [{ sortOrder: "asc" }, { key: "asc" }] })
    .catch(() => [] as ContentBlockRow[]);
});

/** Blocs affichables d'une section (défauts + personnalisations). */
export async function getContentSection(
  section: string,
): Promise<ContentBlockData[]> {
  return resolveSection(section, await loadRows());
}

/** Premier bloc actif d'une section « à contenu unique » (page légale, encart). */
export async function getContentBlock(
  section: string,
): Promise<ContentBlockData | undefined> {
  return resolveSingle(section, await loadRows());
}

/**
 * Plusieurs sections d'un coup — une seule lecture en base grâce au cache.
 * Pratique pour une page qui compose plusieurs encarts.
 */
export async function getContentSections(
  sections: string[],
): Promise<Record<string, ContentBlockData[]>> {
  const rows = await loadRows();
  return Object.fromEntries(
    sections.map((section) => [section, resolveSection(section, rows)]),
  );
}

/** Lignes brutes, pour l'écran d'édition `/admin/contenus`. */
export async function getContentRows(): Promise<ContentBlockRow[]> {
  return loadRows();
}
