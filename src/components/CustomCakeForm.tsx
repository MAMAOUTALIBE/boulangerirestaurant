"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestCustomCake, type ActionState } from "@/app/actions";

const field =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

const occasions = [
  "Anniversaire",
  "Mariage",
  "Baptême / Communion",
  "Fête / Événement",
  "Entreprise",
  "Autre",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Envoyer ma demande"}
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
        <Field id="name" label="Votre nom" error={state?.errors?.name} />
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
        <div>
          <label
            htmlFor="occasion"
            className="mb-1.5 block text-sm text-cream/80"
          >
            Occasion
          </label>
          <select id="occasion" name="occasion" required className={field}>
            {occasions.map((o) => (
              <option key={o} value={o} className="text-ink">
                {o}
              </option>
            ))}
          </select>
          {state?.errors?.occasion && (
            <p className="mt-1 text-xs text-red-400">{state.errors.occasion}</p>
          )}
        </div>
        <Field
          id="servings"
          label="Nombre de parts"
          type="number"
          error={state?.errors?.servings}
        />
      </div>

      <Field
        id="flavor"
        label="Parfum / base souhaité (ex : chocolat, fraisier…)"
        error={state?.errors?.flavor}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="pickupDate"
          label="Date de retrait"
          type="date"
          error={state?.errors?.pickupDate}
        />
        <Field
          id="pickupTime"
          label="Heure de retrait (optionnel)"
          type="time"
          required={false}
          error={state?.errors?.pickupTime}
        />
      </div>

      <Field
        id="messageOnCake"
        label="Message à écrire sur le gâteau (optionnel)"
        required={false}
        error={state?.errors?.messageOnCake}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="budget"
          label="Budget indicatif (optionnel)"
          required={false}
          error={state?.errors?.budget}
        />
        <Field
          id="allergies"
          label="Allergies (optionnel)"
          required={false}
          error={state?.errors?.allergies}
        />
      </div>

      <Field
        id="inspirationUrl"
        label="Lien d'une photo d'inspiration (Pinterest, Instagram…)"
        type="url"
        required={false}
        placeholder="https://…"
        error={state?.errors?.inspirationUrl}
      />

      <div>
        <label htmlFor="details" className="mb-1.5 block text-sm text-cream/80">
          Décrivez le gâteau de vos rêves
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          required
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
  );
}

function Field({
  id,
  label,
  type = "text",
  required = true,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
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
        className={field}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
