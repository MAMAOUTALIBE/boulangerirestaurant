/** Résolution fail-closed du réglage stocké en base. */
export function resolveOnlineOrderingEnabled(
  value: boolean | null | undefined,
): boolean {
  return value === true;
}
