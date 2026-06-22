"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Send, Star } from "lucide-react";
import {
  sendContactMessage,
  submitReview,
  type ActionState,
} from "@/app/actions";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-cream placeholder:text-muted transition focus:border-gold/70 focus:outline-none";

function StatusMessage({ state }: { state: ActionState | null }) {
  if (!state) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`text-sm ${state.ok ? "text-green-300" : "text-red-300"}`}
    >
      {state.message}
    </p>
  );
}

function ReviewSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-ink shadow-[0_14px_32px_-22px_rgba(216,154,28,0.95)] transition hover:-translate-y-0.5 hover:bg-gold-400 disabled:opacity-60"
    >
      {pending ? "Publication..." : "Publier mon avis"}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function ContactSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-ink shadow-[0_14px_32px_-22px_rgba(216,154,28,0.95)] transition hover:-translate-y-0.5 hover:bg-gold-400 disabled:opacity-60"
    >
      {pending ? "Envoi..." : "Envoyer le message"}
      <Send className="h-4 w-4" />
    </button>
  );
}

export function PremiumReviewForm() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    submitReview,
    null,
  );
  const [rating, setRating] = useState(5);

  return (
    <form action={formAction} className="space-y-2.5">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <span className="mb-1.5 block text-sm text-cream/85">Votre note</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              className="transition hover:scale-110"
            >
              <Star
                className={`h-5 w-5 ${
                  n <= rating ? "fill-gold text-gold" : "text-white/20"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="premium-review-name"
          className="mb-1 block text-sm text-cream/85"
        >
          Nom
        </label>
        <input
          id="premium-review-name"
          name="name"
          required
          placeholder="Votre nom"
          className={fieldClass}
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-300">{state.errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="premium-review-comment"
          className="mb-1 block text-sm text-cream/85"
        >
          Votre avis
        </label>
        <textarea
          id="premium-review-comment"
          name="comment"
          rows={2}
          required
          placeholder="Partagez votre expérience..."
          className={fieldClass}
        />
        {state?.errors?.comment && (
          <p className="mt-1 text-xs text-red-300">{state.errors.comment}</p>
        )}
      </div>

      <StatusMessage state={state} />
      <ReviewSubmitButton />
    </form>
  );
}

export function PremiumContactForm() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    sendContactMessage,
    null,
  );

  return (
    <form action={formAction} className="space-y-2.5">
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
          htmlFor="premium-contact-name"
          className="mb-1 block text-sm text-cream/85"
        >
          Nom
        </label>
        <input
          id="premium-contact-name"
          name="name"
          required
          placeholder="Votre nom"
          className={fieldClass}
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-300">{state.errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="premium-contact-email"
          className="mb-1 block text-sm text-cream/85"
        >
          Email
        </label>
        <input
          id="premium-contact-email"
          name="email"
          type="email"
          required
          placeholder="votre@email.com"
          className={fieldClass}
        />
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-300">{state.errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="premium-contact-message"
          className="mb-1 block text-sm text-cream/85"
        >
          Message
        </label>
        <textarea
          id="premium-contact-message"
          name="message"
          rows={2}
          required
          placeholder="Votre message..."
          className={fieldClass}
        />
        {state?.errors?.message && (
          <p className="mt-1 text-xs text-red-300">{state.errors.message}</p>
        )}
      </div>

      <StatusMessage state={state} />
      <ContactSubmitButton />
    </form>
  );
}
