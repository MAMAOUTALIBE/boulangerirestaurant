"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendContactMessage, type ActionState } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Envoyer le message"}
    </button>
  );
}

const fieldClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

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
    <form action={formAction} className="space-y-4">
      {/* Honeypot anti-spam */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
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
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-400">{state.errors.name}</p>
        )}
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
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-400">{state.errors.email}</p>
        )}
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
