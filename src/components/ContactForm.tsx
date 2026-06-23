"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendContactMessage, type ActionState } from "@/app/actions";

function SubmitButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${compact ? "min-h-10 w-full px-4 py-2 text-sm" : ""} btn-primary disabled:opacity-60`}
    >
      {pending ? "Envoi…" : compact ? "Envoyer" : "Envoyer le message"}
    </button>
  );
}

const fieldClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";
const compactFieldClass =
  "h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[0.82rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";
const compactTextareaClass =
  "min-h-[4.25rem] w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[0.82rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

/** Formulaire de contact relié à la Server Action. */
export function ContactForm() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    sendContactMessage,
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
      <form action={formAction} className="space-y-2 sm:hidden">
        <AntiSpamInput />
        <CompactField
          id="mobile-contact-name"
          name="name"
          label="Nom"
          placeholder="Nom"
          autoComplete="name"
          error={state?.errors?.name}
        />
        <CompactField
          id="mobile-contact-email"
          name="email"
          label="Email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          error={state?.errors?.email}
        />
        <div>
          <label htmlFor="mobile-contact-message" className="sr-only">
            Message
          </label>
          <textarea
            id="mobile-contact-message"
            name="message"
            required
            rows={3}
            placeholder="Message"
            maxLength={280}
            className={compactTextareaClass}
          />
          <FieldError error={state?.errors?.message} />
        </div>
        {state && !state.ok && !state.errors && (
          <p role="alert" className="text-xs text-red-400">
            {state.message}
          </p>
        )}
        <SubmitButton compact />
      </form>

      <form action={formAction} className="hidden space-y-4 sm:block">
        <AntiSpamInput />
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block text-sm text-cream/80"
          >
            Nom
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            className={fieldClass}
          />
          <FieldError error={state?.errors?.name} />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block text-sm text-cream/80"
          >
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className={fieldClass}
          />
          <FieldError error={state?.errors?.email} />
        </div>
        <div>
          <label
            htmlFor="contact-message"
            className="mb-1.5 block text-sm text-cream/80"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            className={fieldClass}
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
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={compactFieldClass}
      />
      <FieldError error={error} />
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-400">{error}</p>;
}
