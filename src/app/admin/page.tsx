import Link from "next/link";
import { ShoppingBag, Users, Clock, Euro, AlertTriangle } from "lucide-react";
import { getAllOrders } from "@/lib/orders";
import { listCustomers } from "@/lib/customers";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { SEGMENTS, segmentStyles, needsReengagement } from "@/lib/segmentation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [orders, customers, reservationsCount] = await Promise.all([
    getAllOrders(),
    listCustomers(),
    prisma.reservation.count(),
  ]);
  const customersCount = customers.length;

  // Répartition par segment + clients à relancer.
  const segmentCounts = SEGMENTS.map((s) => ({
    segment: s,
    count: customers.filter((c) => c.segment === s).length,
  })).filter((s) => s.count > 0);
  const toReengage = customers.filter((c) => needsReengagement(c.segment));

  const paid = orders.filter((o) => o.status === "payée");
  const ca = paid.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "en attente").length;
  const avgBasket = paid.length ? ca / paid.length : 0;

  // Alerte cuisine : commandes en retard (échéance dépassée, pas encore prêtes).
  const nowMs = Date.now();
  const lateOrders = orders.filter((o) => {
    if (!["en attente", "payée", "en préparation"].includes(o.status))
      return false;
    const due = o.scheduledAt
      ? new Date(o.scheduledAt).getTime()
      : new Date(o.createdAt).getTime() + o.prepTimeMin * 60000;
    return nowMs > due;
  }).length;

  // CA des 14 derniers jours (par jour).
  const days: { label: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const total = paid
      .filter((o) => o.createdAt.slice(0, 10) === key)
      .reduce((s, o) => s + o.total, 0);
    days.push({ label: key.slice(5), total });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  // Top plats (toutes commandes confondues).
  const dishCount = new Map<string, number>();
  for (const o of orders) {
    for (const it of o.items) {
      dishCount.set(it.name, (dishCount.get(it.name) ?? 0) + it.quantity);
    }
  }
  const topDishes = Array.from(dishCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-cream">
        Tableau de bord
      </h1>

      {/* Alerte cuisine : commandes en retard */}
      {lateOrders > 0 && (
        <Link
          href="/admin/service"
          className="flex items-center gap-3 rounded-2xl border border-red-500/50 bg-red-500/10 px-5 py-4 text-red-200 transition hover:bg-red-500/15"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="font-semibold">
            {lateOrders} commande{lateOrders > 1 ? "s" : ""} en retard en
            cuisine
          </span>
          <span className="ml-auto text-sm underline">Voir le service →</span>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi Icon={Euro} label="CA encaissé" value={formatPrice(ca)} />
        <Kpi
          Icon={ShoppingBag}
          label="Commandes"
          value={String(orders.length)}
          sub={`${pending} en attente`}
        />
        <Kpi Icon={Clock} label="Panier moyen" value={formatPrice(avgBasket)} />
        <Kpi
          Icon={Users}
          label="Clients"
          value={String(customersCount)}
          sub={`${reservationsCount} réservations`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graphe CA 14 jours */}
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-cream">
            CA des 14 derniers jours
          </h2>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {days.map((d) => (
              <div
                key={d.label}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t bg-gold/80 transition-all"
                  style={{ height: `${(d.total / maxDay) * 100}%` }}
                  title={`${d.label} : ${formatPrice(d.total)}`}
                />
                <span className="text-[9px] text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top plats */}
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-6">
          <h2 className="font-display text-lg font-semibold text-cream">
            Top plats
          </h2>
          {topDishes.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Pas encore de données.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topDishes.map(([name, qty]) => (
                <li
                  key={name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-cream/90">{name}</span>
                  <span className="font-semibold text-gold">{qty}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Segments clients + relance */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-cream">
              Segments clients
            </h2>
            <Link
              href="/admin/clients"
              className="text-sm text-gold hover:underline"
            >
              Voir les clients →
            </Link>
          </div>
          {segmentCounts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Pas encore de clients.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {segmentCounts.map((s) => (
                <Link
                  key={s.segment}
                  href={`/admin/clients?segment=${encodeURIComponent(s.segment)}`}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${segmentStyles[s.segment]}`}
                >
                  {s.segment} · {s.count}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-orange-300">
            <AlertTriangle className="h-5 w-5" />À relancer
          </h2>
          <p className="mt-2 font-display text-3xl font-bold text-cream">
            {toReengage.length}
          </p>
          <p className="mt-1 text-xs text-muted">clients à risque ou perdus</p>
          {toReengage.length > 0 && (
            <Link
              href="/admin/marketing?audience=relance"
              className="mt-3 inline-block rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400"
            >
              Lancer une relance
            </Link>
          )}
        </div>
      </div>

      {/* Dernières commandes */}
      <div className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-cream">
            Dernières commandes
          </h2>
          <Link
            href="/admin/commandes"
            className="text-sm text-gold hover:underline"
          >
            Tout voir →
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Aucune commande.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {orders.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="font-mono text-gold">{o.reference}</span>
                <Link
                  href={`/admin/clients/${encodeURIComponent(o.customer.email)}`}
                  className="text-cream/90 hover:text-gold"
                >
                  {o.customer.name}
                </Link>
                <span className="text-muted">{o.status}</span>
                <span className="text-cream">{formatPrice(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({
  Icon,
  label,
  value,
  sub,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-cream">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}
