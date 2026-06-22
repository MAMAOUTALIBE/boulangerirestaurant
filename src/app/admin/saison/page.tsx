import { prisma } from "@/lib/prisma";
import { getAllSeasonalProducts } from "@/lib/seasonal";
import {
  adminCreateSeasonalProduct,
  adminUpdateSeasonalProduct,
  adminDeleteSeasonalProduct,
  adminSetSeasonalPreorderStatus,
  adminToggleSeasonalPreorderPaid,
} from "@/app/actions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none";
const STATUSES = ["réservé", "confirmé", "prêt", "récupéré", "annulé"];

/** DateTime → valeur d'un input datetime-local (YYYY-MM-DDTHH:mm). */
function toLocalInput(d: Date): string {
  return d.toISOString().slice(0, 16);
}

export default async function AdminSaisonPage() {
  const products = await getAllSeasonalProducts();
  const preorders = await prisma.seasonalPreorder.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { name: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-cream">
        Boutique de saison
      </h1>

      {/* Nouvelle offre */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Nouvelle offre de saison
        </h2>
        <form
          action={adminCreateSeasonalProduct}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <input
            name="name"
            placeholder="Nom"
            required
            className={inputClass}
          />
          <input
            name="price"
            type="number"
            step="0.5"
            placeholder="Prix (€)"
            required
            className={inputClass}
          />
          <input
            name="image"
            placeholder="Image (/images/…)"
            className={`${inputClass} sm:col-span-2`}
          />
          <input
            name="description"
            placeholder="Description"
            className={`${inputClass} sm:col-span-2`}
          />
          <label className="text-xs text-muted">
            Vente — début
            <input
              name="salesStart"
              type="datetime-local"
              required
              className={inputClass}
            />
          </label>
          <label className="text-xs text-muted">
            Vente — fin
            <input
              name="salesEnd"
              type="datetime-local"
              required
              className={inputClass}
            />
          </label>
          <label className="text-xs text-muted">
            Retrait — début
            <input
              name="pickupStart"
              type="date"
              required
              className={inputClass}
            />
          </label>
          <label className="text-xs text-muted">
            Retrait — fin
            <input
              name="pickupEnd"
              type="date"
              required
              className={inputClass}
            />
          </label>
          <input
            name="quota"
            type="number"
            min={0}
            placeholder="Quota (unités)"
            required
            className={inputClass}
          />
          <input
            name="sortOrder"
            type="number"
            placeholder="Ordre (0)"
            className={inputClass}
          />
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Créer l&apos;offre
            </button>
          </div>
        </form>
      </section>

      {/* Offres existantes */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-cream">
          Offres ({products.length})
        </h2>
        {products.map((p) => {
          const remaining = Math.max(0, p.quota - p.sold);
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-white/10 bg-ink-soft p-5"
            >
              <form
                action={adminUpdateSeasonalProduct}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="id" value={p.id} />
                <input
                  name="name"
                  defaultValue={p.name}
                  className={inputClass}
                />
                <input
                  name="price"
                  type="number"
                  step="0.5"
                  defaultValue={p.price}
                  className={inputClass}
                />
                <input
                  name="image"
                  defaultValue={p.image}
                  className={`${inputClass} sm:col-span-2`}
                />
                <input
                  name="description"
                  defaultValue={p.description}
                  className={`${inputClass} sm:col-span-2`}
                />
                <label className="text-xs text-muted">
                  Vente — début
                  <input
                    name="salesStart"
                    type="datetime-local"
                    defaultValue={toLocalInput(p.salesStart)}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted">
                  Vente — fin
                  <input
                    name="salesEnd"
                    type="datetime-local"
                    defaultValue={toLocalInput(p.salesEnd)}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted">
                  Retrait — début
                  <input
                    name="pickupStart"
                    type="date"
                    defaultValue={p.pickupStart}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted">
                  Retrait — fin
                  <input
                    name="pickupEnd"
                    type="date"
                    defaultValue={p.pickupEnd}
                    className={inputClass}
                  />
                </label>
                <input
                  name="quota"
                  type="number"
                  min={0}
                  defaultValue={p.quota}
                  className={inputClass}
                />
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={p.sortOrder}
                  className={inputClass}
                />
                <label className="flex items-center gap-2 text-sm text-cream/80">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={p.active}
                    className="accent-gold"
                  />
                  Active
                </label>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400"
                  >
                    Enregistrer
                  </button>
                  <span className="text-xs text-muted">
                    {formatPrice(p.price)} · {p.sold}/{p.quota} réservés ·{" "}
                    {remaining} restant{remaining > 1 ? "s" : ""}
                  </span>
                </div>
              </form>
              <form action={adminDeleteSeasonalProduct} className="mt-2">
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="text-xs text-red-400 transition hover:text-red-300"
                >
                  Supprimer cette offre
                </button>
              </form>
            </div>
          );
        })}
      </section>

      {/* Précommandes */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-cream">
          Précommandes ({preorders.length})
        </h2>
        {preorders.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-ink-soft p-8 text-center text-muted">
            Aucune précommande.
          </p>
        ) : (
          <ul className="space-y-3">
            {preorders.map((o) => (
              <li
                key={o.id}
                className="rounded-2xl border border-white/10 bg-ink-soft p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-cream">
                    {o.quantity} × {o.product.name}
                  </span>
                  <span className="text-sm text-muted">
                    {o.name} · retrait {o.pickupDate}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      o.paid
                        ? "bg-green-500/15 text-green-300"
                        : "bg-white/10 text-cream/70"
                    }`}
                  >
                    {o.paid ? "payé" : "à payer au retrait"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {o.reference} · {o.email} · {o.phone}
                    {o.notes ? ` · ${o.notes}` : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <form
                      action={adminSetSeasonalPreorderStatus}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={o.id} />
                      <select
                        name="status"
                        defaultValue={o.status}
                        className="rounded-lg border border-white/10 bg-ink px-2 py-1.5 text-xs text-cream focus:border-gold/60 focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gold-400"
                      >
                        OK
                      </button>
                    </form>
                    <form action={adminToggleSeasonalPreorderPaid}>
                      <input type="hidden" name="id" value={o.id} />
                      <input
                        type="hidden"
                        name="paid"
                        value={(!o.paid).toString()}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-cream/80 transition hover:bg-white/10"
                      >
                        {o.paid ? "Marquer non payé" : "Marquer payé"}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
