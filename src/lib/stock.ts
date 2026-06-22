/** Champs de stock d'un produit (sous-ensemble du modèle `Dish`). */
export interface StockFields {
  dailyStock: number | null;
  soldToday: number;
  stockDate: string | null;
}

/** Date du jour au format AAAA-MM-JJ, fuseau Europe/Paris. */
export function stockToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Unités encore disponibles aujourd'hui.
 * `null` = stock illimité. Le compteur `soldToday` est ignoré si `stockDate`
 * n'est pas aujourd'hui (reset paresseux : un nouveau jour repart à zéro).
 */
export function remainingStock(dish: StockFields): number | null {
  if (dish.dailyStock == null) return null;
  const sold = dish.stockDate === stockToday() ? dish.soldToday : 0;
  return Math.max(0, dish.dailyStock - sold);
}

/** Produit épuisé pour aujourd'hui (stock limité tombé à 0). */
export function isSoldOut(dish: StockFields): boolean {
  return remainingStock(dish) === 0;
}
