/**
 * Réordonnancement de la carte — pur / testable (pas de `server-only`, pas de DB).
 *
 * La moitié « écriture » vit dans `moveInList` (src/app/actions.ts), qui se
 * contente de persister ce que calcule ce module.
 *
 * Pourquoi renuméroter toute la liste plutôt qu'échanger deux valeurs : les
 * `sortOrder` en base vivent sur une échelle quelconque (1..n pour les seeds,
 * valeur libre saisie au CRM, doublons créés par la duplication d'un plat).
 * Échanger seulement les deux `sortOrder` concernés projetterait les lignes
 * déplacées sur une échelle étrangère et les ferait sauter par-dessus leurs
 * voisines — « monter » une catégorie pouvait l'envoyer en tête de carte.
 */

export interface OrderableRow {
  id: string;
  sortOrder: number;
}

export interface OrderAssignment {
  id: string;
  sortOrder: number;
}

/**
 * Calcule la renumérotation complète après un déplacement d'un cran.
 *
 * `rows` doit arriver **déjà trié** dans l'ordre affiché. Renvoie uniquement
 * les lignes dont l'ordre change (liste vide = rien à écrire : élément
 * introuvable, déjà en tête, déjà en queue, ou numérotation déjà correcte).
 * La numérotation produite commence à 1, comme les seeds et comme la valeur
 * proposée à la création (`length + 1`), pour qu'un nouvel élément se range
 * naturellement à la fin.
 */
export function planReorder(
  rows: OrderableRow[],
  id: string,
  direction: "up" | "down",
): OrderAssignment[] {
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return [];

  const cible = direction === "up" ? index - 1 : index + 1;
  if (cible < 0 || cible >= rows.length) return [];

  const ordonne = [...rows];
  [ordonne[index], ordonne[cible]] = [ordonne[cible], ordonne[index]];

  return ordonne
    .map((row, rang) => ({
      id: row.id,
      sortOrder: rang + 1,
      avant: row.sortOrder,
    }))
    .filter((entree) => entree.sortOrder !== entree.avant)
    .map(({ id: rowId, sortOrder }) => ({ id: rowId, sortOrder }));
}

/** Applique un plan de renumérotation à une liste (utilitaire de test/aperçu). */
export function applyReorder(
  rows: OrderableRow[],
  plan: OrderAssignment[],
): OrderableRow[] {
  const parId = new Map(plan.map((p) => [p.id, p.sortOrder]));
  return [...rows]
    .map((row) => ({ ...row, sortOrder: parId.get(row.id) ?? row.sortOrder }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}
