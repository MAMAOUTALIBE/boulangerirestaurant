"use client";

import { useEffect, useState } from "react";
import { Bike, Store, Utensils, Check, MapPin } from "lucide-react";
import type { Fulfillment } from "@/types";
import { useOrderChoice, type OrderChoice } from "@/context/OrderContext";
import { checkDelivery } from "@/app/actions";

const MODES: { value: Fulfillment; label: string; Icon: typeof Bike }[] = [
  { value: "emporter", label: "À emporter", Icon: Store },
  { value: "livraison", label: "Livraison", Icon: Bike },
  { value: "surplace", label: "Sur place", Icon: Utensils },
];

interface SlotDTO {
  time: string;
  iso: string;
  available: boolean;
}

function dayLabel(d: Date) {
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  if (isToday) return "Aujourd'hui";
  if (isTomorrow) return "Demain";
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Étape d'entrée de commande : mode + (livraison→CP) + calendrier date/heure. */
export function OrderStarter({
  subtotal,
  onConfirmed,
}: {
  subtotal: number;
  onConfirmed?: () => void;
}) {
  const { choice, setChoice } = useOrderChoice();
  const [mode, setMode] = useState<Fulfillment>(
    choice?.fulfillment ?? "emporter",
  );
  const [postal, setPostal] = useState(choice?.postalCode ?? "");
  const [street, setStreet] = useState(choice?.deliveryStreet ?? "");
  const [city, setCity] = useState(choice?.deliveryCity ?? "");
  const [details, setDetails] = useState(choice?.deliveryDetails ?? "");
  const [deliveryMsg, setDeliveryMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // 7 prochains jours.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const [dateStr, setDateStr] = useState(() =>
    days[0].toISOString().slice(0, 10),
  );
  const [slots, setSlots] = useState<SlotDTO[]>([]);
  const [asap, setAsap] = useState(choice?.scheduledAt == null);
  const [slotIso, setSlotIso] = useState<string | null>(
    choice?.scheduledAt ?? null,
  );

  useEffect(() => {
    fetch(`/api/slots?date=${dateStr}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]));
  }, [dateStr]);

  async function verifyDelivery() {
    if (!postal.trim()) return;
    const r = await checkDelivery(postal, subtotal);
    setDeliveryMsg({ ok: r.ok, text: r.message });
  }

  function confirm() {
    let label = "";
    let scheduledAt: string | null = null;
    if (asap) {
      label = "Dès que possible";
    } else if (slotIso) {
      const d = new Date(slotIso);
      label = `${dayLabel(d)} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
      scheduledAt = slotIso;
    }
    const modeLabel = MODES.find((m) => m.value === mode)!.label;
    const normalizedPostal = postal.trim();
    const normalizedStreet = street.trim();
    const normalizedCity = city.trim();
    const normalizedDetails = details.trim();
    const deliveryAddress =
      mode === "livraison"
        ? [
            normalizedStreet,
            `${normalizedPostal} ${normalizedCity}`.trim(),
            normalizedDetails ? `Complément : ${normalizedDetails}` : "",
          ]
            .filter(Boolean)
            .join(" — ")
        : undefined;
    const c: OrderChoice = {
      fulfillment: mode,
      postalCode: mode === "livraison" ? normalizedPostal : undefined,
      deliveryStreet: mode === "livraison" ? normalizedStreet : undefined,
      deliveryCity: mode === "livraison" ? normalizedCity : undefined,
      deliveryDetails: mode === "livraison" ? normalizedDetails : undefined,
      deliveryAddress,
      scheduledAt,
      label: `${modeLabel} · ${label}`,
    };
    setChoice(c);
    onConfirmed?.();
  }

  const canConfirm =
    (asap || slotIso) &&
    (mode !== "livraison" ||
      (street.trim().length >= 4 &&
        postal.trim().length >= 4 &&
        city.trim().length >= 2 &&
        deliveryMsg?.ok));

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Mode */}
      <div>
        <h3 className="font-display text-lg font-semibold leading-tight text-cream">
          Comment ça se passe ?
        </h3>
        <div className="mt-3 grid min-w-0 grid-cols-3 gap-2">
          {MODES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-3 text-center text-[0.72rem] font-semibold leading-tight transition min-[370px]:text-xs sm:px-3 sm:py-4 sm:text-sm ${
                mode === value
                  ? "border-gold bg-gold/10 text-cream"
                  : "border-white/10 text-cream/70 hover:border-white/30"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
              <span className="max-w-full break-words">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === "livraison" && (
        <div className="rounded-2xl border border-gold/25 bg-gold/[0.06] p-3 sm:p-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ink text-gold">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-cream">
                Adresse de livraison
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                Indiquez l&apos;adresse complète pour éviter toute erreur.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-cream/70">
                N° et rue
              </span>
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="5 rue Jules Vallès"
                autoComplete="street-address"
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-[0.9fr_1.1fr] gap-2">
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-semibold text-cream/70">
                  Code postal
                </span>
                <input
                  id="cp"
                  value={postal}
                  onChange={(e) => {
                    setPostal(e.target.value);
                    setDeliveryMsg(null);
                  }}
                  placeholder="91260"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className="w-full rounded-xl border border-white/10 bg-ink px-3 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-semibold text-cream/70">
                  Ville
                </span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Juvisy-sur-Orge"
                  autoComplete="address-level2"
                  className="w-full rounded-xl border border-white/10 bg-ink px-3 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-cream/70">
                Complément optionnel
              </span>
              <input
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Bâtiment, étage, digicode..."
                autoComplete="address-line2"
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
              />
            </label>

            <button
              type="button"
              onClick={verifyDelivery}
              disabled={postal.trim().length < 4}
              className="w-full rounded-xl border border-gold/40 px-4 py-3 text-sm font-bold text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vérifier la zone de livraison
            </button>
          </div>

          {deliveryMsg && (
            <p
              className={`mt-1 text-xs ${deliveryMsg.ok ? "text-green-400" : "text-red-400"}`}
            >
              {deliveryMsg.text}
            </p>
          )}
        </div>
      )}

      {/* Quand */}
      <div>
        <h3 className="font-display text-lg font-semibold leading-tight text-cream">
          Pour quand ?
        </h3>
        <button
          type="button"
          onClick={() => {
            setAsap(true);
            setSlotIso(null);
          }}
          className={`mt-3 w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
            asap
              ? "border-gold bg-gold/10 text-cream"
              : "border-white/10 text-cream/70 hover:border-white/30"
          }`}
        >
          ⚡ Dès que possible
        </button>

        {/* Jours */}
        <div className="mt-3 grid grid-cols-2 gap-2 min-[430px]:grid-cols-4 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((d, index) => {
            const ds = d.toISOString().slice(0, 10);
            return (
              <button
                key={ds}
                type="button"
                onClick={() => {
                  setDateStr(ds);
                  setAsap(false);
                }}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${index > 3 ? "hidden sm:block" : ""} ${
                  !asap && dateStr === ds
                    ? "border-gold bg-gold/10 text-cream"
                    : "border-white/10 text-cream/70 hover:border-white/30"
                }`}
              >
                {dayLabel(d)}
              </button>
            );
          })}
        </div>

        {/* Créneaux */}
        {!asap && (
          <div className="mt-3 grid grid-cols-3 gap-2 min-[430px]:grid-cols-4 sm:grid-cols-6">
            {slots.length === 0 && (
              <p className="col-span-full text-sm text-muted">
                Fermé ce jour-là.
              </p>
            )}
            {slots.map((s) => (
              <button
                key={s.iso}
                type="button"
                disabled={!s.available}
                onClick={() => setSlotIso(s.iso)}
                className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                  slotIso === s.iso
                    ? "border-gold bg-gold text-ink"
                    : s.available
                      ? "border-white/10 text-cream/80 hover:border-gold/60"
                      : "cursor-not-allowed border-white/5 text-muted/40 line-through"
                }`}
              >
                {s.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={confirm}
        disabled={!canConfirm}
        className="btn-primary min-h-[3.35rem] w-full text-sm disabled:opacity-50 min-[370px]:text-base"
      >
        <Check className="h-4 w-4" />
        Confirmer et continuer
      </button>
    </div>
  );
}
