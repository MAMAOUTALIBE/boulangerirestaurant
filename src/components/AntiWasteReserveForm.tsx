"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { reserveAntiWaste, type ActionState } from "@/app/actions";

const field =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn-primary w-full disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Réserver mon panier"}
    </button>
  );
}

export function AntiWasteReserveForm({ remaining }: { remaining: number }) {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    reserveAntiWaste,
    null,
  );

  if (state?.ok) {
    return (
      <div
        role="status"
        className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center text-sm text-green-300"
      >
        {state.message}
      </div>
    );
  }

  const soldOut = remaining <= 0;

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div>
        <label htmlFor="aw-qty" className="mb-1 block text-xs text-cream/70">
          Nombre de paniers
        </label>
        <input
          id="aw-qty"
          name="quantity"
          type="number"
          min={1}
          max={Math.max(1, Math.min(10, remaining))}
          defaultValue={1}
          required
          disabled={soldOut}
          className={field}
        />
      </div>
      <input
        name="name"
        placeholder="Votre nom"
        required
        disabled={soldOut}
        className={field}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="phone"
          type="tel"
          placeholder="Téléphone"
          required
          disabled={soldOut}
          className={field}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          disabled={soldOut}
          className={field}
        />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
      <SubmitButton disabled={soldOut} />
      <p className="text-center text-xs text-muted">
        Paiement au retrait en boutique.
      </p>
    </form>
  );
}
