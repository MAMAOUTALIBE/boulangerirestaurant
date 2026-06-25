"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestCustomCake, type ActionState } from "@/app/actions";

const field =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";
const compactField =
  "h-9 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[0.8rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 min-[390px]:h-10 min-[390px]:text-[0.82rem]";
const compactTextarea =
  "min-h-14 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[0.8rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 min-[390px]:min-h-[4.25rem] min-[390px]:text-[0.82rem]";
const hiddenCakeDefaults = {
  occasion: "Sur-mesure",
  flavor: "À définir avec la boulangerie",
};

function SubmitButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${compact ? "min-h-9 px-4 py-2 text-sm min-[390px]:min-h-10" : ""} btn-primary w-full disabled:opacity-60`}
    >
      {pending ? "Envoi…" : compact ? "Envoyer" : "Envoyer ma demande"}
    </button>
  );
}

export function CustomCakeForm() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    requestCustomCake,
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
        <input
          type="hidden"
          name="occasion"
          value={hiddenCakeDefaults.occasion}
        />
        <input type="hidden" name="flavor" value={hiddenCakeDefaults.flavor} />

        <div className="grid grid-cols-2 gap-2">
          <CompactField
            id="mobile-cake-name"
            name="name"
            label="Votre nom"
            placeholder="Nom"
            autoComplete="name"
            error={state?.errors?.name}
          />
          <CompactField
            id="mobile-cake-phone"
            name="phone"
            label="Téléphone"
            type="tel"
            placeholder="Téléphone"
            autoComplete="tel"
            inputMode="tel"
            error={state?.errors?.phone}
          />
        </div>

        <CompactField
          id="mobile-cake-email"
          name="email"
          label="Email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          error={state?.errors?.email}
        />

        <div className="grid grid-cols-2 gap-2">
          <CompactField
            id="mobile-cake-pickup-date"
            name="pickupDate"
            label="Date de retrait"
            type="date"
            error={state?.errors?.pickupDate}
          />
          <CompactField
            id="mobile-cake-servings"
            name="servings"
            label="Nombre de parts"
            type="number"
            placeholder="Parts"
            autoComplete="off"
            inputMode="numeric"
            error={state?.errors?.servings}
          />
        </div>

        <div>
          <label htmlFor="mobile-cake-details" className="sr-only">
            Votre projet
          </label>
          <textarea
            id="mobile-cake-details"
            name="details"
            rows={2}
            required
            placeholder="Projet : occasion, parfum, décor..."
            maxLength={240}
            className={compactTextarea}
          />
          <FieldError error={state?.errors?.details} />
        </div>

        {state && !state.ok && !state.errors && (
          <p role="alert" className="text-xs text-red-400">
            {state.message}
          </p>
        )}
        <SubmitButton compact />
        <p className="text-center text-[0.72rem] text-muted">Réponse rapide</p>
      </form>

      <form action={formAction} className="hidden space-y-2.5 sm:block">
        <AntiSpamInput />
        <input
          type="hidden"
          name="occasion"
          value={hiddenCakeDefaults.occasion}
        />
        <input type="hidden" name="flavor" value={hiddenCakeDefaults.flavor} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="name"
            label="Votre nom"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={state?.errors?.email}
          />
          <Field
            id="pickupDate"
            label="Date de retrait souhaitée"
            type="date"
            error={state?.errors?.pickupDate}
          />
        </div>

        <Field
          id="servings"
          label="Nombre de parts"
          type="number"
          autoComplete="off"
          inputMode="numeric"
          error={state?.errors?.servings}
        />

        <div>
          <label
            htmlFor="details"
            className="mb-1.5 block text-sm text-cream/80"
          >
            Décrivez votre gâteau
          </label>
          <textarea
            id="details"
            name="details"
            rows={2}
            required
            placeholder="Occasion, parfum, décor, message, allergies si besoin..."
            className={field}
          />
          {state?.errors?.details && (
            <p className="mt-1 text-xs text-red-400">{state.errors.details}</p>
          )}
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
        placeholder={placeholder}
        min={type === "number" ? 1 : undefined}
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

  return <p className="mt-1 text-[0.68rem] text-red-400">{error}</p>;
}

function Field({
  id,
  label,
  type = "text",
  required = true,
  placeholder,
  autoComplete,
  inputMode,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
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
      <label htmlFor={id} className="mb-1.5 block text-sm text-cream/80">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        min={type === "number" ? 1 : undefined}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={field}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
