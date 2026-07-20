"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";

const LABEL: Record<string, string> = {
  payée: "Commande confirmée",
  "en préparation": "Votre commande est en préparation",
  prête: "Votre commande est prête !",
  "en livraison": "Votre commande est en route",
  livrée: "Commande livrée. Bon appétit !",
};

/** Notifie le client (notification locale) à chaque changement de statut. */
export function OrderStatusNotifier({
  reference,
  initialStatus,
}: {
  reference: string;
  initialStatus: string;
}) {
  const last = useRef(initialStatus);
  const [enabled, setEnabled] = useState(false);
  const { shortName } = useSiteConfig();

  async function enable() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setEnabled(perm === "granted");
  }

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/order-status?reference=${reference}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const { status } = await res.json();
        if (status && status !== last.current) {
          last.current = status;
          if (LABEL[status] && Notification.permission === "granted") {
            new Notification(shortName, { body: LABEL[status] });
          }
        }
      } catch {
        /* ignore */
      }
    }, 20000);
    return () => clearInterval(id);
  }, [enabled, reference, shortName]);

  if (enabled) return null;
  return (
    <button
      onClick={enable}
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-cream transition hover:border-gold/60 hover:text-gold"
    >
      <Bell className="h-4 w-4" />
      M&apos;avertir de l&apos;avancement
    </button>
  );
}
