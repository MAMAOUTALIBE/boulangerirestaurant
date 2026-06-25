"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestCatering, type ActionState } from "@/app/actions";

const field =
  "h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";
const textareaField =
  "min-h-14 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";
const compactField =
  "h-9 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[0.8rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 min-[390px]:h-10 min-[390px]:text-[0.82rem]";
const compactTextarea =
  "min-h-14 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[0.8rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 min-[390px]:min-h-[4.25rem] min-[390px]:text-[0.82rem]";

function SubmitButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${compact ? "min-h-9 px-4 py-2 text-sm min-[390px]:min-h-10" : "sm:min-h-10 sm:px-5 sm:py-2"} btn-primary w-full disabled:opacity-60`}
    >
      {pending ? "Envoi…" : compact ? "Envoyer" : "Demander un devis"}
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
    <>
      <form
        action={formAction}
        className="space-y-1.5 min-[390px]:space-y-2 sm:hidden"
      >
        <AntiSpamInput />
        <div className="grid grid-cols-2 gap-2">
          <CompactField
            id="mobile-catering-name"
            name="name"
            label="Nom / organisation"
            placeholder="Nom"
            autoComplete="name"
            error={state?.errors?.name}
          />
          <CompactField
            id="mobile-catering-phone"
            name="phone"
            label="Téléphone"
            type="tel"
            placeholder="Téléphone"
            autoComplete="tel"
            inputMode="tel"
            error={state?.errors?.phone}
          />
        </div>

        <div className="grid grid-cols-[1fr_7.25rem] gap-2">
          <CompactField
            id="mobile-catering-email"
            name="email"
            label="Email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            inputMode="email"
            error={state?.errors?.email}
          />
          <CompactField
            id="mobile-catering-guests"
            name="guests"
            label="Nombre de convives"
            type="number"
            placeholder="Convives"
            autoComplete="off"
            inputMode="numeric"
            error={state?.errors?.guests}
          />
        </div>

        <div>
          <label htmlFor="mobile-catering-message" className="sr-only">
            Votre projet
          </label>
          <textarea
            id="mobile-catering-message"
            name="message"
            rows={2}
            required
            placeholder="Projet : date, formule, lieu..."
            maxLength={240}
            className={compactTextarea}
          />
          <FieldError error={state?.errors?.message} />
        </div>

        {state && !state.ok && !state.errors && (
          <p role="alert" className="text-xs text-red-400">
            {state.message}
          </p>
        )}
        <SubmitButton compact />
        <p className="text-center text-[0.72rem] text-muted">
          Réponse sous 48 h
        </p>
      </form>

      <form action={formAction} className="hidden space-y-1.5 sm:block">
        <AntiSpamInput />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="name"
            label="Nom / organisation"
            autoComplete="name"
            error={state?.errors?.name}
          />
          <Field
            id="phone"
            label="Téléphone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            error={state?.errors?.phone}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={state?.errors?.email}
          />
          <Field
            id="guests"
            label="Nombre de convives"
            type="number"
            autoComplete="off"
            inputMode="numeric"
            error={state?.errors?.guests}
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="mb-1 block text-xs font-medium text-cream/80"
          >
            Votre projet
          </label>
          <textarea
            id="message"
            name="message"
            rows={2}
            required
            placeholder="Projet : date, formule, lieu, horaires..."
            className={textareaField}
          />
          <FieldError error={state?.errors?.message} />
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

function Field({
  id,
  label,
  type = "text",
  required = true,
  autoComplete,
  inputMode,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
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
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-cream/80"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        min={type === "number" ? 1 : undefined}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={field}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
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
        min={type === "number" ? 1 : undefined}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={compactField}
      />
      <FieldError error={error} />
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-400">{error}</p>;
}
