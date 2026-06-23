"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createReservation, type ActionState } from "@/app/actions";

const field =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";
const compactField =
  "h-9 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[0.8rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 min-[390px]:h-10 min-[390px]:text-[0.82rem]";
const compactTextarea =
  "min-h-12 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[0.8rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 min-[390px]:min-h-14 min-[390px]:text-[0.82rem]";

function SubmitButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${compact ? "min-h-9 px-4 py-2 text-sm min-[390px]:min-h-10" : ""} btn-primary w-full disabled:opacity-60`}
    >
      {pending ? "Envoi…" : compact ? "Réserver" : "Demander une réservation"}
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
        className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center text-sm text-green-300 sm:p-6 sm:text-base"
      >
        {state.message}
      </div>
    );
  }

  return (
    <>
      <form
        action={formAction}
        className="space-y-1.5 min-[390px]:space-y-2 sm:hidden"
      >
        <AntiSpamInput />

        <div className="grid grid-cols-2 gap-2">
          <CompactField
            id="mobile-reservation-name"
            name="name"
            label="Nom complet"
            placeholder="Nom"
            autoComplete="name"
            error={state?.errors?.name}
            defaultValue={defaults.name}
          />
          <CompactField
            id="mobile-reservation-phone"
            name="phone"
            label="Téléphone"
            type="tel"
            placeholder="Téléphone"
            autoComplete="tel"
            inputMode="tel"
            error={state?.errors?.phone}
            defaultValue={defaults.phone}
          />
        </div>

        <CompactField
          id="mobile-reservation-email"
          name="email"
          label="Email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          error={state?.errors?.email}
          defaultValue={defaults.email}
        />

        <div className="grid grid-cols-2 gap-2">
          <CompactField
            id="mobile-reservation-date"
            name="date"
            label="Date"
            type="date"
            error={state?.errors?.date}
            defaultValue={defaults.date}
          />
          <CompactField
            id="mobile-reservation-time"
            name="time"
            label="Heure"
            type="time"
            error={state?.errors?.time}
            defaultValue={defaults.time}
          />
        </div>

        <CompactField
          id="mobile-reservation-guests"
          name="guests"
          label="Convives"
          type="number"
          placeholder="Nombre de convives"
          autoComplete="off"
          inputMode="numeric"
          error={state?.errors?.guests}
          defaultValue={defaults.guests}
        />

        <div>
          <label htmlFor="mobile-reservation-notes" className="sr-only">
            Demande particulière
          </label>
          <textarea
            id="mobile-reservation-notes"
            name="notes"
            rows={2}
            placeholder="Demande particulière"
            maxLength={180}
            defaultValue={defaults.notes}
            className={compactTextarea}
          />
        </div>

        {state && !state.ok && !state.errors && (
          <p role="alert" className="text-xs text-red-400">
            {state.message}
          </p>
        )}
        <SubmitButton compact />
        <p className="text-center text-[0.72rem] text-muted">
          Confirmation par email
        </p>
      </form>

      <form action={formAction} className="hidden space-y-4 sm:block">
        <AntiSpamInput />
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
    </>
  );
}

function AntiSpamInput() {
  return (
    <input
      type="text"
      name="company"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute left-[-9999px] h-0 w-0 opacity-0"
    />
  );
}

function CompactField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  error,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  error?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        min={type === "number" ? 1 : undefined}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        className={compactField}
      />
      <FieldError error={error} />
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;

  return <p className="mt-1 text-[0.68rem] text-red-400">{error}</p>;
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
