"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getReorderItems } from "@/app/actions";

/** Recharge les articles d'une commande passée dans le panier. */
export function ReorderButton({ reference }: { reference: string }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reorder() {
    setLoading(true);
    const lines = await getReorderItems(reference);
    for (const l of lines) {
      const optionsTotal = (l.options ?? []).reduce(
        (s, o) => s + o.priceDelta,
        0,
      );
      addItem(
        {
          dishId: l.id,
          name: l.name,
          image: l.image,
          basePrice: l.price - optionsTotal,
          options: l.options,
          note: l.note,
        },
        l.quantity,
      );
    }
    router.push("/commander");
  }

  return (
    <button
      onClick={reorder}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/10 disabled:opacity-60"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {loading ? "…" : "Recommander"}
    </button>
  );
}
