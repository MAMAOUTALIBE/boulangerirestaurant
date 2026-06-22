"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { submitReview, type ActionState } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Publier mon avis"}
    </button>
  );
}

const field =
  "w-full rounded-xl border border-white/10 bg-ink-soft px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none";

/** Formulaire d'avis client (note + commentaire). */
export function ReviewForm() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    submitReview,
    null,
  );
  const [rating, setRating] = useState(5);

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
      <input type="hidden" name="rating" value={rating} />
      <div>
        <span className="mb-1.5 block text-sm text-cream/80">Votre note</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-7 w-7 ${n <= rating ? "fill-gold text-gold" : "text-white/20"}`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="r-name" className="mb-1.5 block text-sm text-cream/80">
          Nom
        </label>
        <input id="r-name" name="name" required className={field} />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-400">{state.errors.name}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="r-comment"
          className="mb-1.5 block text-sm text-cream/80"
        >
          Votre avis
        </label>
        <textarea
          id="r-comment"
          name="comment"
          rows={3}
          required
          className={field}
        />
        {state?.errors?.comment && (
          <p className="mt-1 text-xs text-red-400">{state.errors.comment}</p>
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
