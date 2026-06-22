"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

const POLL_MS = 15_000;

/** Bip court via Web Audio (pas de fichier audio à charger). */
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
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio indisponible : on ignore.
  }
}

/** Cloche de notification : poll les commandes, badge + son à chaque nouvelle. */
export function OrderNotifier() {
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const lastRef = useRef<string | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/admin/orders/pending", {
          cache: "no-store",
        });
        if (!res.ok || !active) return;
        const data = await res.json();
        setPending(data.pending ?? 0);

        if (!initialised.current) {
          lastRef.current = data.latestReference ?? null;
          initialised.current = true;
        } else if (
          data.latestReference &&
          data.latestReference !== lastRef.current
        ) {
          lastRef.current = data.latestReference;
          beep();
          router.refresh(); // rafraîchit les données serveur affichées
        }
      } catch {
        // réseau indisponible : on réessaiera au prochain tick
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [router]);

  return (
    <Link
      href="/admin/commandes?statut=en+attente"
      aria-label={`${pending} commande(s) en attente`}
      className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 text-cream transition hover:border-gold/60 hover:text-gold"
    >
      <Bell className="h-4 w-4" />
      {pending > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
          {pending}
        </span>
      )}
    </Link>
  );
}
