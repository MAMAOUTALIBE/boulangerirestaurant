import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dayBounds(dateStr?: string) {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    0,
    0,
    0,
  );
  const end = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    23,
    59,
    59,
  );
  return { start, end };
}

export default async function RecapPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const { start, end } = dayBounds(date);
  const dateLabel = start.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: { items: true, events: true },
  });

  const valid = orders.filter((o) => o.status !== "annulée");
  const ca = valid.reduce((s, o) => s + o.total, 0);
  const avgBasket = valid.length ? ca / valid.length : 0;

  // Répartition par mode.
  const byMode = { livraison: 0, emporter: 0, surplace: 0 } as Record<
    string,
    number
  >;
  for (const o of valid)
    byMode[o.fulfillment] = (byMode[o.fulfillment] ?? 0) + 1;

  // Top plats du jour.
  const dishCount = new Map<string, number>();
  for (const o of valid)
    for (const it of o.items)
      dishCount.set(it.name, (dishCount.get(it.name) ?? 0) + it.quantity);
  const topDishes = Array.from(dishCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Temps moyen de préparation : « en préparation » → « prête ».
  const durations: number[] = [];
  for (const o of valid) {
    const ev = [...o.events].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const startPrep = ev.find((e) => e.status === "en préparation");
    const ready = ev.find((e) => e.status === "prête");
    if (startPrep && ready) {
      durations.push(
        (ready.createdAt.getTime() - startPrep.createdAt.getTime()) / 60000,
      );
    }
  }
  const avgPrep = durations.length
    ? durations.reduce((s, v) => s + v, 0) / durations.length
    : 0;

  // Commandes annulées.
  const cancelled = orders.filter((o) => o.status === "annulée").length;

  const prevDay = new Date(start);
  prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(start);
  nextDay.setDate(nextDay.getDate() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-cream">
          Récap de service
        </h1>
        <form action="/admin/recap" className="flex items-center gap-2">
          <a
            href={`/admin/recap?date=${iso(prevDay)}`}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-cream hover:border-gold/60"
          >
            ←
          </a>
          <input
            type="date"
            name="date"
            defaultValue={iso(start)}
            className="rounded-lg border border-white/10 bg-ink-soft px-3 py-1.5 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <button className="rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-ink">
            OK
          </button>
          <a
            href={`/admin/recap?date=${iso(nextDay)}`}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-cream hover:border-gold/60"
          >
            →
          </a>
        </form>
      </div>
      <p className="text-sm capitalize text-muted">{dateLabel}</p>

      {/* KPIs du jour */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Commandes"
          value={String(valid.length)}
          sub={cancelled ? `${cancelled} annulée(s)` : undefined}
        />
        <Kpi label="CA du jour" value={formatPrice(ca)} highlight />
        <Kpi label="Panier moyen" value={formatPrice(avgBasket)} />
        <Kpi
          label="Prépa moyenne"
          value={durations.length ? `${avgPrep.toFixed(0)} min` : "—"}
          sub={`${durations.length} mesurée(s)`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Répartition par mode */}
        <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
          <h2 className="font-display text-lg font-semibold text-cream">
            Par mode
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <Mode
              label="🛵 Livraison"
              n={byMode.livraison}
              total={valid.length}
            />
            <Mode
              label="🛍️ À emporter"
              n={byMode.emporter}
              total={valid.length}
            />
            <Mode
              label="🍽️ Sur place"
              n={byMode.surplace}
              total={valid.length}
            />
          </ul>
        </section>

        {/* Top plats */}
        <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
          <h2 className="font-display text-lg font-semibold text-cream">
            Top plats du jour
          </h2>
          {topDishes.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucune vente.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {topDishes.map(([name, qty]) => (
                <li key={name} className="flex justify-between">
                  <span className="text-cream/90">{name}</span>
                  <span className="font-semibold text-gold">×{qty}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${highlight ? "border-gold/40 bg-gold/5" : "border-white/10 bg-ink-soft"}`}
    >
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-1 font-display text-2xl font-bold ${highlight ? "text-gold" : "text-cream"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Mode({
  label,
  n,
  total,
}: {
  label: string;
  n: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <li>
      <div className="flex justify-between text-cream/85">
        <span>{label}</span>
        <span>
          {n} ({pct}%)
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gold"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}
