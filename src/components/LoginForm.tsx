"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adminLogin, login, type ActionState } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Recevoir mon lien de connexion"}
    </button>
  );
}

function AdminSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full disabled:opacity-60"
    >
      {pending ? "Connexion…" : "Accéder au CRM"}
    </button>
  );
}

/** Formulaire de connexion par lien magique (email vérifié). */
export function LoginForm({ initialError }: { initialError?: boolean }) {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm text-cream/80">
          Votre email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-white/10 bg-ink-soft px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
      </div>
      {state && (
        <p
          role="status"
          className={`text-sm ${state.ok ? "text-green-400" : "text-red-400"}`}
        >
          {state.message}
        </p>
      )}
      {!state && initialError && (
        <p role="alert" className="text-sm text-red-400">
          Lien invalide ou expiré. Demandez-en un nouveau.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    adminLogin,
    null,
  );

  return (
    <form
      action={formAction}
      className="mt-8 space-y-4 rounded-2xl border border-gold/30 bg-ink-soft p-5"
    >
      <div>
        <h2 className="font-display text-xl font-bold text-cream">
          Accès admin CRM
        </h2>
        <p className="mt-1 text-sm text-muted">
          Connexion directe pour vos tests du dashboard.
        </p>
      </div>
      <div>
        <label
          htmlFor="admin-email"
          className="mb-1.5 block text-sm text-cream/80"
        >
          Email admin
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-sm text-cream/80"
        >
          Mot de passe
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
        />
      </div>
      {state && (
        <p
          role="alert"
          className={`text-sm ${state.ok ? "text-green-400" : "text-red-400"}`}
        >
          {state.message}
        </p>
      )}
      <AdminSubmitButton />
    </form>
  );
}
