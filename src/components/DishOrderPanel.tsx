"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import type { CartLineOption } from "@/types";

interface OptionDTO {
  id: string;
  name: string;
  priceDelta: number;
}
interface GroupDTO {
  id: string;
  name: string;
  type: string; // single | multi
  required: boolean;
  options: OptionDTO[];
}
interface DishDTO {
  slug: string;
  name: string;
  image: string;
  basePrice: number;
}

/** Sélection d'options + note + ajout au panier (page fiche plat). */
export function DishOrderPanel({
  dish,
  groups,
}: {
  dish: DishDTO;
  groups: GroupDTO[];
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toggle(group: GroupDTO, optionId: string) {
    setSelected((prev) => {
      const cur = prev[group.id] ?? [];
      if (group.type === "single") return { ...prev, [group.id]: [optionId] };
      return {
        ...prev,
        [group.id]: cur.includes(optionId)
          ? cur.filter((o) => o !== optionId)
          : [...cur, optionId],
      };
    });
  }

  const chosen: CartLineOption[] = groups.flatMap((g) =>
    (selected[g.id] ?? []).map((oid) => {
      const o = g.options.find((x) => x.id === oid)!;
      return {
        groupId: g.id,
        optionId: o.id,
        label: o.name,
        priceDelta: o.priceDelta,
      };
    }),
  );
  const unitPrice =
    dish.basePrice + chosen.reduce((s, o) => s + o.priceDelta, 0);

  function add() {
    // Vérifie les groupes obligatoires.
    const missing = groups.find(
      (g) => g.required && (selected[g.id] ?? []).length === 0,
    );
    if (missing) {
      setError(`Choisissez : ${missing.name}`);
      return;
    }
    addItem({
      dishId: dish.slug,
      name: dish.name,
      image: dish.image,
      basePrice: dish.basePrice,
      options: chosen,
      note: note.trim() || undefined,
    });
    router.push("/menu");
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <fieldset key={g.id}>
          <legend className="font-display text-lg font-semibold text-cream">
            {g.name}{" "}
            <span className="text-sm font-normal text-muted">
              {g.required
                ? "(obligatoire)"
                : g.type === "multi"
                  ? "(plusieurs)"
                  : "(au choix)"}
            </span>
          </legend>
          <div className="mt-3 space-y-2">
            {g.options.map((o) => {
              const isSel = (selected[g.id] ?? []).includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(g, o.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                    isSel
                      ? "border-gold bg-gold/10 text-cream"
                      : "border-white/10 text-cream/80 hover:border-white/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full border ${
                        isSel
                          ? "border-gold bg-gold text-ink"
                          : "border-white/20"
                      }`}
                    >
                      {isSel && <Check className="h-3 w-3" />}
                    </span>
                    {o.name}
                  </span>
                  {o.priceDelta > 0 && (
                    <span className="text-gold">
                      + {formatPrice(o.priceDelta)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm text-cream/80">
          Instructions spéciales (optionnel)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ex : sans oignon, bien épicé…"
          className="w-full rounded-xl border border-white/10 bg-ink-soft px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button onClick={add} className="btn-primary w-full">
        Ajouter au panier — {formatPrice(unitPrice)}
      </button>
    </div>
  );
}
