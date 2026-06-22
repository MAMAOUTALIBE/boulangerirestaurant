import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { adminAssignDriver } from "@/app/actions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  prête: "bg-purple-500/15 text-purple-300",
  "en livraison": "bg-cyan-500/15 text-cyan-300",
};

export default async function LivraisonsPage() {
  const [orders, drivers] = await Promise.all([
    prisma.order.findMany({
      where: {
        fulfillment: "livraison",
        status: { in: ["payée", "en préparation", "prête", "en livraison"] },
      },
      orderBy: { createdAt: "asc" },
      include: { driver: true },
    }),
    prisma.driver.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const enCours = orders.filter((o) => o.status === "en livraison").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-cream">
          Livraisons
        </h1>
        <span className="text-sm text-muted">
          {orders.length} à livrer · {enCours} en cours · {drivers.length}{" "}
          livreur·s actifs
        </span>
      </div>

      {drivers.length === 0 && (
        <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-gold">
          Aucun livreur actif. Ajoutez-en dans{" "}
          <Link href="/admin/parametres" className="underline">
            Paramètres
          </Link>
          .
        </p>
      )}

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucune commande en livraison.
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-white/10 bg-ink-soft p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/admin/commandes/${o.reference}`}
                  className="font-mono text-gold hover:underline"
                >
                  {o.reference}
                </Link>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[o.status] ?? "bg-white/10 text-cream"}`}
                >
                  {o.status}
                </span>
                <span className="text-sm text-cream">
                  {formatPrice(o.total)}
                </span>
              </div>
              <p className="mt-2 text-sm text-cream/85">
                {o.customerName} · {o.customerPhone}
              </p>
              {o.customerAddress && (
                <p className="text-sm text-muted">{o.customerAddress}</p>
              )}

              <form
                action={adminAssignDriver}
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="reference" value={o.reference} />
                <label htmlFor={`d-${o.id}`} className="text-sm text-cream/80">
                  Livreur :
                </label>
                <select
                  id={`d-${o.id}`}
                  name="driverId"
                  defaultValue={o.driverId ?? ""}
                  className="rounded-lg border border-white/10 bg-ink px-3 py-1.5 text-sm text-cream focus:border-gold/60 focus:outline-none"
                >
                  <option value="">— non assigné —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg bg-gold px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-gold-400">
                  Assigner
                </button>
                {o.driver && (
                  <span className="text-xs text-muted">
                    Actuel : {o.driver.name}
                  </span>
                )}
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
