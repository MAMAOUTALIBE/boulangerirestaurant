import { getAllOrders } from "@/lib/orders";
import { listCustomers } from "@/lib/customers";
import { formatPrice } from "@/lib/utils";
import { buildHeatmap, forecastRevenue } from "@/lib/analytics";
import { Heatmap } from "@/components/admin/Heatmap";

export const dynamic = "force-dynamic";

const RANGES: Record<string, number> = { "7": 7, "30": 30, "90": 90 };

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode } = await searchParams;
  const days = RANGES[periode ?? "30"] ?? 30;
  const now = Date.now();
  const since = now - days * 86_400_000;
  const prevSince = since - days * 86_400_000;

  const [orders, customers] = await Promise.all([
    getAllOrders(),
    listCustomers(),
  ]);
  const paid = orders.filter((o) => o.status !== "annulée");

  const inRange = (o: (typeof paid)[number], from: number, to: number) => {
    const t = new Date(o.createdAt).getTime();
    return t >= from && t < to;
  };

  const current = paid.filter((o) => inRange(o, since, now));
  const previous = paid.filter((o) => inRange(o, prevSince, since));

  const caCurrent = current.reduce((s, o) => s + o.total, 0);
  const caPrevious = previous.reduce((s, o) => s + o.total, 0);
  const variation =
    caPrevious === 0
      ? current.length > 0
        ? 100
        : 0
      : ((caCurrent - caPrevious) / caPrevious) * 100;

  // CA par plat (sur la période).
  const byDish = new Map<string, { qty: number; ca: number }>();
  for (const o of current) {
    for (const it of o.items) {
      const e = byDish.get(it.name) ?? { qty: 0, ca: 0 };
      e.qty += it.quantity;
      e.ca += it.price * it.quantity;
      byDish.set(it.name, e);
    }
  }
  const dishRanking = Array.from(byDish.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.ca - a.ca);

  // Top clients (LTV global).
  const topClients = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const reachat =
    customers.length > 0
      ? (customers.filter((c) => c.ordersCount >= 2).length /
          customers.length) *
        100
      : 0;

  // Heatmap heures de pointe : heure de service (créneau choisi sinon création).
  const heatmap = buildHeatmap(paid.map((o) => o.scheduledAt ?? o.createdAt));

  // Prévision de CA : totaux quotidiens des 14 derniers jours (du + ancien au + récent).
  const dailyTotals: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = now - (i + 1) * 86_400_000;
    const dayEnd = now - i * 86_400_000;
    dailyTotals.push(
      paid
        .filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= dayStart && t < dayEnd;
        })
        .reduce((s, o) => s + o.total, 0),
    );
  }
  const forecast = forecastRevenue(dailyTotals);

  // Synthèse financière (toutes commandes non annulées, hors période).
  const fin = paid.reduce(
    (acc, o) => {
      acc.brut += o.subtotal;
      acc.remises += o.discount;
      acc.net += o.total;
      if (o.status === "payée" || o.status === "livrée")
        acc.encaisse += o.total;
      return acc;
    },
    { brut: 0, remises: 0, net: 0, encaisse: 0 },
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-cream">Rapports</h1>
        <form action="/admin/rapports" className="flex gap-2">
          <select
            name="periode"
            defaultValue={String(days)}
            className="rounded-xl border border-white/10 bg-ink-soft px-4 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          >
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
            <option value="90">90 jours</option>
          </select>
          <button type="submit" className="btn-primary px-4">
            Appliquer
          </button>
        </form>
      </div>

      {/* KPIs période */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
          <p className="text-sm text-muted">CA ({days} j)</p>
          <p className="mt-1 font-display text-2xl font-bold text-cream">
            {formatPrice(caCurrent)}
          </p>
          <p
            className={`mt-1 text-xs ${variation >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {variation >= 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(0)}% vs
            période précédente
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
          <p className="text-sm text-muted">Commandes ({days} j)</p>
          <p className="mt-1 font-display text-2xl font-bold text-cream">
            {current.length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
          <p className="text-sm text-muted">Taux de réachat</p>
          <p className="mt-1 font-display text-2xl font-bold text-cream">
            {reachat.toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-muted">clients avec ≥ 2 commandes</p>
        </div>
      </div>

      {/* Prévision de CA */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Prévision de chiffre d&apos;affaires
        </h2>
        <p className="mt-1 text-sm text-muted">
          Basée sur la moyenne mobile des 7 derniers jours.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Fin
            label="Moyenne / jour"
            value={formatPrice(forecast.dailyAverage)}
          />
          <Fin
            label="Tendance (7j)"
            value={`${forecast.trendPct >= 0 ? "▲" : "▼"} ${Math.abs(forecast.trendPct).toFixed(0)}%`}
          />
          <Fin label="Projection 7 jours" value={formatPrice(forecast.next7)} />
          <Fin
            label="Projection 30 jours"
            value={formatPrice(forecast.next30)}
            highlight
          />
        </div>
      </section>

      {/* Heatmap heures de pointe */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-cream">
            Heures de pointe
          </h2>
          {heatmap.busiest && (
            <span className="text-sm text-muted">
              Pic :{" "}
              <span className="text-gold">
                {heatmap.busiest.day} {heatmap.busiest.hour}h
              </span>{" "}
              ({heatmap.busiest.count})
            </span>
          )}
        </div>
        <Heatmap data={heatmap} />
      </section>

      {/* Synthèse financière */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-cream">
            Synthèse financière (global)
          </h2>
          <a
            href="/api/admin/finance.csv"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-cream transition hover:border-gold/60 hover:text-gold"
          >
            Export financier CSV
          </a>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Fin label="CA brut" value={formatPrice(fin.brut)} />
          <Fin label="Remises" value={`− ${formatPrice(fin.remises)}`} />
          <Fin label="CA net" value={formatPrice(fin.net)} />
          <Fin label="Encaissé" value={formatPrice(fin.encaisse)} highlight />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CA par plat */}
        <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
          <h2 className="font-display text-lg font-semibold text-cream">
            CA par plat ({days} j)
          </h2>
          {dishRanking.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Aucune vente sur la période.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {dishRanking.map((d) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-cream/90">
                    {d.name} <span className="text-muted">×{d.qty}</span>
                  </span>
                  <span className="font-semibold text-gold">
                    {formatPrice(d.ca)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top clients */}
        <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
          <h2 className="font-display text-lg font-semibold text-cream">
            Top clients (valeur totale)
          </h2>
          {topClients.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucun client.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {topClients.map((c) => (
                <li
                  key={c.email}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-cream/90">{c.name || c.email}</span>
                  <span className="font-semibold text-gold">
                    {formatPrice(c.totalSpent)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Fin({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-gold/40 bg-gold/5" : "border-white/10 bg-ink"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-bold ${highlight ? "text-gold" : "text-cream"}`}
      >
        {value}
      </p>
    </div>
  );
}
