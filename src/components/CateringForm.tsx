"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestCatering, type ActionState } from "@/app/actions";

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
      {pending ? "Envoi…" : "Demander un devis"}
    </button>
  );
}

export function CateringForm() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    requestCatering,
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
          label="Nom / organisation"
          error={state?.errors?.name}
        />
        <Field
          id="phone"
          label="Téléphone"
          type="tel"
          error={state?.errors?.phone}
        />
      </div>
      <Field
        id="email"
        label="Email"
        type="email"
        error={state?.errors?.email}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="eventDate"
          label="Date de l'événement (optionnel)"
          type="date"
          required={false}
          error={state?.errors?.eventDate}
        />
        <Field
          id="guests"
          label="Nombre de convives"
          type="number"
          error={state?.errors?.guests}
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm text-cream/80">
          Votre projet
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className={field}
        />
        {state?.errors?.message && (
          <p className="mt-1 text-xs text-red-400">{state.errors.message}</p>
        )}
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
  required = true,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
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
        required={required}
        min={type === "number" ? 1 : undefined}
        className={field}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
