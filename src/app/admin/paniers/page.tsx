import { prisma } from "@/lib/prisma";
import { getAllOrders } from "@/lib/orders";
import { adminRelaunchCart } from "@/app/actions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Un panier est « abandonné » s'il est actif et inactif depuis 30 min.
const ABANDON_AFTER_MS = 30 * 60 * 1000;

export default async function PaniersPage() {
  const [carts, orders] = await Promise.all([
    prisma.abandonedCart.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    getAllOrders(),
  ]);

  const now = Date.now();
  const totalCarts = carts.length;
  const converted = carts.filter((c) => c.status === "converti").length;
  const paidOrders = orders.filter(
    (o) => o.status !== "en attente" && o.status !== "annulée",
  ).length;
  const abandoned = carts.filter(
    (c) =>
      c.status === "actif" &&
      now - new Date(c.updatedAt).getTime() > ABANDON_AFTER_MS,
  );
  const lostValue = abandoned.reduce((s, c) => s + c.total, 0);
  const convRate = totalCarts > 0 ? (converted / totalCarts) * 100 : 0;
  const abandonRate =
    totalCarts > 0 ? (abandoned.length / totalCarts) * 100 : 0;

  // Funnel : paniers créés → commandes créées → commandes payées.
  const steps = [
    { label: "Paniers", value: totalCarts },
    { label: "Commandes", value: orders.length },
    { label: "Payées", value: paidOrders },
  ];
  const maxStep = Math.max(1, ...steps.map((s) => s.value));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-cream">
        Paniers & conversion
      </h1>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi
          label="Taux de conversion"
          value={`${convRate.toFixed(0)}%`}
          highlight
        />
        <Kpi label="Taux d'abandon" value={`${abandonRate.toFixed(0)}%`} />
        <Kpi label="Paniers abandonnés" value={String(abandoned.length)} />
        <Kpi label="Valeur perdue" value={formatPrice(lostValue)} />
      </div>

      {/* Funnel */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Entonnoir de conversion
        </h2>
        <div className="mt-4 space-y-3">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-28 text-sm text-muted">{s.label}</span>
              <div className="h-6 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="flex h-full items-center justify-end rounded-full bg-gold px-2 text-xs font-bold text-ink"
                  style={{
                    width: `${Math.max(8, (s.value / maxStep) * 100)}%`,
                  }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Liste des paniers abandonnés */}
      <section>
        <h2 className="font-display text-lg font-semibold text-cream">
          Paniers abandonnés ({abandoned.length})
        </h2>
        {abandoned.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-white/10 bg-ink-soft p-8 text-center text-muted">
            Aucun panier abandonné. 🎉
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {abandoned.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-ink-soft p-4 text-sm"
              >
                <span className="text-cream">
                  {c.email ?? "(email inconnu)"}
                </span>
                <span className="text-muted">
                  {c.itemCount} article·s · {formatPrice(c.total)}
                </span>
                <span className="text-xs text-muted">
                  {new Date(c.updatedAt).toLocaleString("fr-FR")}
                </span>
                <div className="ml-auto">
                  {c.email ? (
                    <form action={adminRelaunchCart}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-gold-400">
                        Relancer
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-muted">non relançable</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {carts.some((c) => c.status === "relancé") && (
          <p className="mt-3 text-xs text-muted">
            {carts.filter((c) => c.status === "relancé").length} panier·s déjà
            relancé·s.
          </p>
        )}
      </section>
    </div>
  );
}

function Kpi({
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
      className={`rounded-2xl border p-5 ${highlight ? "border-gold/40 bg-gold/5" : "border-white/10 bg-ink-soft"}`}
    >
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-1 font-display text-2xl font-bold ${highlight ? "text-gold" : "text-cream"}`}
      >
        {value}
      </p>
    </div>
  );
}
