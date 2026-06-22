"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { reserveSeasonal, type ActionState } from "@/app/actions";

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
      {pending ? "Envoi…" : "Précommander"}
    </button>
  );
}

export function SeasonalPreorderForm({
  slug,
  remaining,
  pickupStart,
  pickupEnd,
}: {
  slug: string;
  remaining: number;
  pickupStart: string;
  pickupEnd: string;
}) {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    reserveSeasonal,
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
      <input type="hidden" name="slug" value={slug} />
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-xs text-cream/70"
            htmlFor={`q-${slug}`}
          >
            Quantité
          </label>
          <input
            id={`q-${slug}`}
            name="quantity"
            type="number"
            min={1}
            max={Math.max(1, remaining)}
            defaultValue={1}
            required
            disabled={soldOut}
            className={field}
          />
        </div>
        <div>
          <label
            className="mb-1 block text-xs text-cream/70"
            htmlFor={`d-${slug}`}
          >
            Retrait
          </label>
          <input
            id={`d-${slug}`}
            name="pickupDate"
            type="date"
            min={pickupStart}
            max={pickupEnd}
            required
            disabled={soldOut}
            className={field}
          />
        </div>
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
      <input
        name="notes"
        placeholder="Précisions (optionnel)"
        disabled={soldOut}
        className={field}
      />
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
