"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createReservation, type ActionState } from "@/app/actions";

const field =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Demander une réservation"}
    </button>
  );
}

export interface ReservationDefaults {
  name?: string;
  phone?: string;
  email?: string;
  date?: string;
  time?: string;
  guests?: string;
  notes?: string;
}

export function ReservationForm({
  defaults = {},
}: {
  defaults?: ReservationDefaults;
}) {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    createReservation,
    null,
  );

  if (state?.ok) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center text-green-300"
      >
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="name"
          label="Nom complet"
          error={state?.errors?.name}
          defaultValue={defaults.name}
        />
        <Field
          id="phone"
          label="Téléphone"
          type="tel"
          error={state?.errors?.phone}
          defaultValue={defaults.phone}
        />
      </div>
      <Field
        id="email"
        label="Email"
        type="email"
        error={state?.errors?.email}
        defaultValue={defaults.email}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="date"
          label="Date"
          type="date"
          error={state?.errors?.date}
          defaultValue={defaults.date}
        />
        <Field
          id="time"
          label="Heure"
          type="time"
          error={state?.errors?.time}
          defaultValue={defaults.time}
        />
        <Field
          id="guests"
          label="Convives"
          type="number"
          error={state?.errors?.guests}
          defaultValue={defaults.guests}
        />
      </div>
      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm text-cream/80">
          Demandes particulières (optionnel)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={field}
          defaultValue={defaults.notes}
        />
      </div>
      {state && !state.ok && !state.errors && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  error,
  defaultValue,
}: {
  id: string;
  label: string;
  type?: string;
  error?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-cream/80">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        min={type === "number" ? 1 : undefined}
        defaultValue={defaultValue}
        className={field}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
