import { HEATMAP_DAYS, type Heatmap as HeatmapData } from "@/lib/analytics";

/** Couleur de cellule selon l'intensité (0 → transparent, max → or). */
function cellColor(value: number, max: number): string {
  if (value === 0) return "rgba(255,255,255,0.04)";
  const ratio = max > 0 ? value / max : 0;
  // Or (#E0A82E) avec opacité croissante.
  return `rgba(224,168,46,${0.15 + ratio * 0.85})`;
}

/** Grille jours × heures colorée par volume de commandes. */
export function Heatmap({ data }: { data: HeatmapData }) {
  if (data.total === 0) {
    return (
      <p className="mt-4 text-sm text-muted">Pas encore assez de commandes.</p>
    );
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-10" />
            {data.hours.map((h) => (
              <th key={h} className="text-[10px] font-medium text-muted">
                {h}h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HEATMAP_DAYS.map((day, row) => (
            <tr key={day}>
              <td className="pr-1 text-right text-xs text-muted">{day}</td>
              {data.hours.map((h, col) => {
                const v = data.matrix[row][col];
                return (
                  <td key={h}>
                    <div
                      title={`${day} ${h}h : ${v} commande${v > 1 ? "s" : ""}`}
                      className="grid h-7 w-7 place-items-center rounded text-[10px] font-semibold text-ink"
                      style={{ backgroundColor: cellColor(v, data.max) }}
                    >
                      {v > 0 ? v : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
