"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { subscribeNewsletter, type ActionState } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="S'inscrire à la newsletter"
      className="btn-primary px-4 disabled:opacity-60"
    >
      <Send className="h-4 w-4" />
      <span className="hidden sm:inline">{pending ? "…" : "S'inscrire"}</span>
    </button>
  );
}

/** Formulaire d'inscription newsletter relié à la Server Action. */
export function NewsletterForm() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    subscribeNewsletter,
    null,
  );

  return (
    <form action={formAction} className="mt-4">
      {/* Honeypot anti-spam : invisible pour les humains, rempli par les bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Votre adresse email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Votre email"
          aria-describedby="newsletter-status"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
        <SubmitButton />
      </div>
      {state && (
        <p
          id="newsletter-status"
          role="status"
          className={`mt-2 text-xs ${state.ok ? "text-green-400" : "text-red-400"}`}
        >
          {state.errors?.email ?? state.message}
        </p>
      )}
    </form>
  );
}
