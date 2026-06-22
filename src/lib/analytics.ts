/**
 * Construit une heatmap « heures de pointe » : volume par jour × heure.
 * Pur (testable) — prend des timestamps ISO et une plage d'heures.
 */
export interface Forecast {
  /** Moyenne quotidienne récente (7 derniers jours). */
  dailyAverage: number;
  /** Tendance vs les 7 jours précédents (en %). */
  trendPct: number;
  /** Projections. */
  next7: number;
  next30: number;
}

/**
 * Prévision de CA à partir des totaux quotidiens (du plus ancien au plus récent).
 * Moyenne mobile 7 jours + tendance vs la semaine précédente.
 */
export function forecastRevenue(dailyTotals: number[]): Forecast {
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const last7 = dailyTotals.slice(-7);
  const prev7 = dailyTotals.slice(-14, -7);
  const dailyAverage = avg(last7);
  const prevAverage = avg(prev7);
  const trendPct =
    prevAverage > 0
      ? ((dailyAverage - prevAverage) / prevAverage) * 100
      : dailyAverage > 0
        ? 100
        : 0;
  return {
    dailyAverage,
    trendPct,
    next7: dailyAverage * 7,
    next30: dailyAverage * 30,
  };
}

export const HEATMAP_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
// getDay(): 0=dimanche … 6=samedi → index d'affichage (Lun en premier).
const DOW_TO_ROW: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  0: 6,
};

export interface Heatmap {
  hours: number[];
  /** matrix[row 0..6 (Lun..Dim)][hourIndex] = nombre de commandes. */
  matrix: number[][];
  max: number;
  total: number;
  busiest: { day: string; hour: number; count: number } | null;
}

export function buildHeatmap(
  isoTimes: string[],
  minHour = 11,
  maxHour = 23,
): Heatmap {
  const hours: number[] = [];
  for (let h = minHour; h <= maxHour; h++) hours.push(h);

  const matrix = HEATMAP_DAYS.map(() => hours.map(() => 0));
  let max = 0;
  let total = 0;
  let busiest: Heatmap["busiest"] = null;

  for (const iso of isoTimes) {
    const d = new Date(iso);
    const row = DOW_TO_ROW[d.getDay()];
    const hourIdx = d.getHours() - minHour;
    if (row === undefined || hourIdx < 0 || hourIdx >= hours.length) continue;
    matrix[row][hourIdx] += 1;
    total += 1;
    const v = matrix[row][hourIdx];
    if (v > max) {
      max = v;
      busiest = { day: HEATMAP_DAYS[row], hour: hours[hourIdx], count: v };
    }
  }

  return { hours, matrix, max, total, busiest };
}
