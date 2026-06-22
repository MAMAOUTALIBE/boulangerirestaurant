import { prisma } from "@/lib/prisma";
import { getRecentAntiWasteOffers } from "@/lib/antiwaste";
import { stockToday } from "@/lib/stock";
import {
  adminUpsertAntiWasteOffer,
  adminDeleteAntiWasteOffer,
  adminSetAntiWasteReservationStatus,
  adminToggleAntiWasteReservationPaid,
} from "@/app/actions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none";
const STATUSES = ["réservé", "récupéré", "annulé"];

export default async function AdminAntiGaspiPage() {
  const today = stockToday();
  const todayOffer = await prisma.antiWasteOffer.findUnique({
    where: { date: today },
  });
  const offers = await getRecentAntiWasteOffers();
  const reservations = await prisma.antiWasteReservation.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { offer: { select: { date: true, title: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-cream">
        Paniers anti-gaspi
      </h1>

      {/* Offre du jour (création / mise à jour) */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Offre du jour {todayOffer ? "(modifier)" : "(créer)"}
        </h2>
        <form
          action={adminUpsertAntiWasteOffer}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <label className="text-xs text-muted">
            Jour
            <input
              name="date"
              type="date"
              defaultValue={today}
              required
              className={inputClass}
            />
          </label>
          <input
            name="title"
            placeholder="Titre"
            defaultValue={todayOffer?.title ?? "Panier surprise du soir"}
            className={inputClass}
          />
          <input
            name="description"
            placeholder="Description"
            defaultValue={todayOffer?.description ?? ""}
            className={`${inputClass} sm:col-span-2`}
          />
          <input
            name="price"
            type="number"
            step="0.5"
            placeholder="Prix (€)"
            defaultValue={todayOffer?.price ?? 5}
            required
            className={inputClass}
          />
          <input
            name="originalValue"
            type="number"
            step="0.5"
            placeholder="Valeur indicative (€)"
            defaultValue={todayOffer?.originalValue ?? ""}
            className={inputClass}
          />
          <input
            name="quantity"
            type="number"
            min={0}
            placeholder="Nombre de paniers"
            defaultValue={todayOffer?.quantity ?? 8}
            required
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-muted">
              Retrait — début
              <input
                name="pickupStart"
                type="time"
                defaultValue={todayOffer?.pickupStart ?? "18:00"}
                className={inputClass}
              />
            </label>
            <label className="text-xs text-muted">
              Retrait — fin
              <input
                name="pickupEnd"
                type="time"
                defaultValue={todayOffer?.pickupEnd ?? "19:30"}
                className={inputClass}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input
              type="checkbox"
              name="active"
              defaultChecked={todayOffer?.active ?? true}
              className="accent-gold"
            />
            Active (visible sur le site)
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              {todayOffer ? "Mettre à jour" : "Créer l'offre du jour"}
            </button>
          </div>
        </form>
      </section>

      {/* Offres récentes */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-cream">
          Offres récentes
        </h2>
        {offers.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-ink-soft p-8 text-center text-muted">
            Aucune offre enregistrée.
          </p>
        ) : (
          <ul className="space-y-2">
            {offers.map((o) => {
              const remaining = Math.max(0, o.quantity - o.sold);
              return (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-ink-soft p-4"
                >
                  <span className="text-sm text-cream">
                    <strong>{o.date}</strong> · {o.title} ·{" "}
                    {formatPrice(o.price)}
                  </span>
                  <span className="text-xs text-muted">
                    {o.sold}/{o.quantity} réservés · {remaining} restant
                    {remaining > 1 ? "s" : ""} ·{" "}
                    {o.active ? "active" : "inactive"}
                  </span>
                  <form action={adminDeleteAntiWasteOffer}>
                    <input type="hidden" name="id" value={o.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-400 transition hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Réservations */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-cream">
          Réservations ({reservations.length})
        </h2>
        {reservations.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-ink-soft p-8 text-center text-muted">
            Aucune réservation.
          </p>
        ) : (
          <ul className="space-y-3">
            {reservations.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-white/10 bg-ink-soft p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-cream">
                    {r.quantity} × {r.offer.title}
                  </span>
                  <span className="text-sm text-muted">
                    {r.name} · {r.offer.date}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      r.paid
                        ? "bg-green-500/15 text-green-300"
                        : "bg-white/10 text-cream/70"
                    }`}
                  >
                    {r.paid ? "payé" : "à payer au retrait"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {r.reference} · {r.email} · {r.phone}
                  </span>
                  <div className="flex items-center gap-2">
                    <form
                      action={adminSetAntiWasteReservationStatus}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <select
                        name="status"
                        defaultValue={r.status}
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
                    <form action={adminToggleAntiWasteReservationPaid}>
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        type="hidden"
                        name="paid"
                        value={(!r.paid).toString()}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-cream/80 transition hover:bg-white/10"
                      >
                        {r.paid ? "Marquer non payé" : "Marquer payé"}
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
