"use client";

import { useEffect, useState } from "react";
import { Bike, Store, Utensils, Check } from "lucide-react";
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
    const c: OrderChoice = {
      fulfillment: mode,
      postalCode: mode === "livraison" ? postal.trim() : undefined,
      scheduledAt,
      label: `${modeLabel} · ${label}`,
    };
    setChoice(c);
    onConfirmed?.();
  }

  const canConfirm =
    (asap || slotIso) &&
    (mode !== "livraison" || (postal.trim().length >= 4 && deliveryMsg?.ok));

  return (
    <div className="space-y-6">
      {/* Mode */}
      <div>
        <h3 className="font-display text-lg font-semibold text-cream">
          Comment ça se passe ?
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {MODES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm transition ${
                mode === value
                  ? "border-gold bg-gold/10 text-cream"
                  : "border-white/10 text-cream/70 hover:border-white/30"
              }`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "livraison" && (
        <div className="rounded-xl border border-white/10 bg-ink-soft p-4">
          <label htmlFor="cp" className="mb-1.5 block text-sm text-cream/80">
            Code postal de livraison
          </label>
          <div className="flex gap-2">
            <input
              id="cp"
              value={postal}
              onChange={(e) => {
                setPostal(e.target.value);
                setDeliveryMsg(null);
              }}
              placeholder="91260"
              className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={verifyDelivery}
              className="shrink-0 rounded-xl border border-gold/40 px-4 text-sm font-semibold text-gold transition hover:bg-gold/10"
            >
              Vérifier
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
        <h3 className="font-display text-lg font-semibold text-cream">
          Pour quand ?
        </h3>
        <button
          type="button"
          onClick={() => {
            setAsap(true);
            setSlotIso(null);
          }}
          className={`mt-3 w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
            asap
              ? "border-gold bg-gold/10 text-cream"
              : "border-white/10 text-cream/70 hover:border-white/30"
          }`}
        >
          ⚡ Dès que possible
        </button>

        {/* Jours */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const ds = d.toISOString().slice(0, 10);
            return (
              <button
                key={ds}
                type="button"
                onClick={() => {
                  setDateStr(ds);
                  setAsap(false);
                }}
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs transition ${
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
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
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
        className="btn-primary w-full disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        Confirmer et continuer
      </button>
    </div>
  );
}
