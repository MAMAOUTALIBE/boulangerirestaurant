"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BellOff,
  Bell,
  Eye,
  Clock,
  Volume2,
} from "lucide-react";
import { advanceOrderStatus } from "@/app/actions";
import { formatPrice } from "@/lib/utils";
import {
  computeServiceAlert,
  type AlertLevel,
  type AlertThresholds,
} from "@/lib/service-alert";

export interface ServiceOrder {
  id: string;
  reference: string;
  customerName: string;
  status: string;
  total: number;
  fulfillment: string;
  dueAtMs: number;
  enteredAtMs: number;
  items: { name: string; quantity: number }[];
}

const COLUMNS: { status: string; label: string; cta: string }[] = [
  { status: "en attente", label: "À encaisser", cta: "Encaisser" },
  { status: "payée", label: "À préparer", cta: "Commencer" },
  { status: "en préparation", label: "En préparation", cta: "Prête" },
  { status: "prête", label: "Prêtes", cta: "Livrée" },
];

const ACK_KEY = "restaurant-service-ack";
const MODE_KEY = "restaurant-service-mode";

type AlertMode = "voix" | "bip" | "muet";

/** Annonce vocale (Web Speech API), en français. */
function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* synthèse vocale indisponible */
  }
}

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 760;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* audio indisponible */
  }
}

export function ServiceBoard({
  orders,
  thresholds,
}: {
  orders: ServiceOrder[];
  thresholds: AlertThresholds;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [ack, setAck] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<AlertMode>("voix");
  const lastAlarm = useRef(0);

  // Restaure acquittements + mode d'alerte.
  useEffect(() => {
    try {
      const a = window.localStorage.getItem(ACK_KEY);
      if (a) setAck(new Set(JSON.parse(a)));
      const m = window.localStorage.getItem(MODE_KEY) as AlertMode | null;
      if (m === "voix" || m === "bip" || m === "muet") setMode(m);
    } catch {
      /* ignore */
    }
  }, []);

  // Horloge (1s) + rafraîchissement données (20s).
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const refresh = setInterval(() => router.refresh(), 20000);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [router]);

  function ackKey(o: ServiceOrder) {
    return `${o.reference}:${o.status}`;
  }
  function acknowledge(o: ServiceOrder) {
    setAck((prev) => {
      const next = new Set(prev).add(ackKey(o));
      try {
        window.localStorage.setItem(ACK_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  }
  function cycleMode() {
    setMode((m) => {
      const next: AlertMode =
        m === "voix" ? "bip" : m === "bip" ? "muet" : "voix";
      try {
        window.localStorage.setItem(MODE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // Calcule les alertes.
  const evaluated = useMemo(
    () =>
      orders.map((o) => ({
        order: o,
        alert: computeServiceAlert(
          {
            status: o.status,
            dueAtMs: o.dueAtMs,
            enteredAtMs: o.enteredAtMs,
            nowMs: now,
          },
          thresholds,
        ),
        acknowledged: ack.has(`${o.reference}:${o.status}`),
      })),
    [orders, now, thresholds, ack],
  );

  const lateCount = evaluated.filter((e) => e.alert.level === "late").length;
  const stagnantCount = evaluated.filter(
    (e) => e.alert.level === "stagnant",
  ).length;
  const unackList = evaluated.filter(
    (e) =>
      (e.alert.level === "late" || e.alert.level === "stagnant") &&
      !e.acknowledged,
  );
  const unack = unackList.length;

  // Alarme répétée (voix ou bip) tant qu'une alerte n'est pas acquittée.
  useEffect(() => {
    if (mode === "muet" || unack === 0) return;
    if (now - lastAlarm.current >= 12000) {
      lastAlarm.current = now;
      if (mode === "bip") {
        beep();
      } else {
        const refs = unackList.filter((e) => e.alert.level === "late");
        const msg =
          refs.length === 0
            ? `${unack} commande${unack > 1 ? "s" : ""} bloquée${unack > 1 ? "s" : ""}`
            : refs.length === 1
              ? `Commande ${refs[0].order.reference.replace(/-/g, " ")} en retard`
              : `${refs.length} commandes en retard`;
        speak(msg);
      }
    }
  }, [now, unack, mode, unackList]);

  // Prochaine pointe : créneau (minute) avec le plus de commandes à venir.
  const nextRush = useMemo(() => {
    const upcoming = orders.filter((o) => o.dueAtMs >= now);
    const byMin = new Map<number, number>();
    for (const o of upcoming) {
      const k = Math.floor(o.dueAtMs / 60000);
      byMin.set(k, (byMin.get(k) ?? 0) + 1);
    }
    let best: { at: number; n: number } | null = null;
    for (const [k, n] of Array.from(byMin.entries())) {
      if (n >= 2 && (!best || n > best.n)) best = { at: k * 60000, n };
    }
    return best;
  }, [orders, now]);

  const byStatus = (s: string) => evaluated.filter((e) => e.order.status === s);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-cream">Service</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={cycleMode}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-cream transition hover:border-gold/60"
            title="Cliquer pour changer le mode d'alerte"
          >
            {mode === "voix" ? (
              <Volume2 className="h-4 w-4" />
            ) : mode === "bip" ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            Alerte :{" "}
            {mode === "voix" ? "Voix" : mode === "bip" ? "Bip" : "Muet"}
          </button>
          <span className="text-sm text-muted">
            {evaluated.length} active(s) · maj 20 s
          </span>
        </div>
      </div>

      {/* Bandeau d'alerte global */}
      {(lateCount > 0 || stagnantCount > 0 || nextRush) && (
        <div
          className={`flex flex-wrap items-center gap-4 rounded-2xl border px-5 py-3 text-sm ${
            lateCount > 0
              ? "border-red-500/40 bg-red-500/10 text-red-200"
              : "border-orange-500/30 bg-orange-500/10 text-orange-200"
          }`}
        >
          {lateCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              {lateCount} commande{lateCount > 1 ? "s" : ""} en retard
            </span>
          )}
          {stagnantCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {stagnantCount} bloquée{stagnantCount > 1 ? "s" : ""}
            </span>
          )}
          {nextRush && (
            <span className="ml-auto text-xs">
              ⏱ Pointe à venir :{" "}
              {new Date(nextRush.at).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ({nextRush.n} commandes)
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = byStatus(col.status);
          return (
            <div key={col.status} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-cream">
                  {col.label}
                </h2>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-cream">
                  {list.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {list.length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted">
                    —
                  </p>
                )}
                {list.map((e) => (
                  <Card
                    key={e.order.id}
                    order={e.order}
                    level={e.alert.level}
                    reason={e.alert.reason}
                    acknowledged={e.acknowledged}
                    cta={col.cta}
                    onAck={() => acknowledge(e.order)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({
  order,
  level,
  reason,
  acknowledged,
  cta,
  onAck,
}: {
  order: ServiceOrder;
  level: AlertLevel;
  reason: string;
  acknowledged: boolean;
  cta: string;
  onAck: () => void;
}) {
  const alarm = level === "late" || level === "stagnant";
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - order.enteredAtMs) / 60000),
  );

  const border =
    level === "late"
      ? "border-red-500/60"
      : level === "stagnant"
        ? "border-red-400/50"
        : level === "imminent"
          ? "border-orange-400/50"
          : "border-white/10";

  const active = alarm && !acknowledged;
  // Rouge + rapide pour « en retard », orange + plus lent pour « stagnant ».
  const alertColor = level === "late" ? "#ef4444" : "#f59e0b";
  const alertSpeed = level === "late" ? "0.9s" : "1.6s";

  return (
    <div
      className={`${active ? "alert-rotating" : ""} ${active && level === "late" ? "alert-glow" : ""}`}
      style={
        active
          ? ({
              "--alert-color": alertColor,
              "--alert-speed": alertSpeed,
            } as React.CSSProperties)
          : undefined
      }
    >
      <article
        className={`relative rounded-2xl border bg-ink-soft p-4 ${border} ${active ? "alert-blink" : ""}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-gold">{order.reference}</span>
          <span
            className={`text-xs ${level === "late" ? "text-red-300" : "text-muted"}`}
          >
            {minutes} min
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-cream">
          {order.customerName}
        </p>
        <ul className="mt-2 space-y-0.5 text-sm text-cream/80">
          {order.items.map((i, idx) => (
            <li key={idx}>
              {i.quantity}× {i.name}
            </li>
          ))}
        </ul>

        {alarm && (
          <div
            className={`mt-2 flex items-center justify-between rounded-lg px-2 py-1 text-xs ${
              level === "late"
                ? "bg-red-500/15 text-red-200"
                : "bg-orange-500/15 text-orange-200"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {reason}
            </span>
            {!acknowledged && (
              <button
                onClick={onAck}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold text-cream hover:bg-white/25"
              >
                <Eye className="h-3 w-3" /> Vu
              </button>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-display font-bold text-cream">
            {formatPrice(order.total)}
          </span>
          <form action={advanceOrderStatus}>
            <input type="hidden" name="reference" value={order.reference} />
            <input type="hidden" name="current" value={order.status} />
            <button
              type="submit"
              className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-gold-400"
            >
              {cta} →
            </button>
          </form>
        </div>
      </article>
    </div>
  );
}
