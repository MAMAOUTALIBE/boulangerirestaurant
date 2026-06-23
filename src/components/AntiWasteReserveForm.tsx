"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { reserveAntiWaste, type ActionState } from "@/app/actions";

const field =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";
const compactField =
  "h-9 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[0.8rem] text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 min-[390px]:h-10 min-[390px]:text-[0.82rem]";

function SubmitButton({
  disabled,
  compact = false,
}: {
  disabled: boolean;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${compact ? "min-h-9 px-4 py-2 text-sm min-[390px]:min-h-10" : ""} btn-primary w-full disabled:opacity-60`}
    >
      {pending ? "Envoi…" : "Réserver mon panier"}
    </button>
  );
}

export function AntiWasteReserveForm({ remaining }: { remaining: number }) {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    reserveAntiWaste,
    null,
  );

  if (state?.ok) {
    return (
      <div
        role="status"
        className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center text-sm text-green-300"
      >
        {state.message}
      </div>
    );
  }

  const soldOut = remaining <= 0;

  return (
    <>
      <form
        action={formAction}
        className="space-y-1.5 min-[390px]:space-y-2 sm:hidden"
      >
        <BotField />
        <div className="grid grid-cols-[5.5rem_1fr] gap-2">
          <CompactInput
            id="m-aw-qty"
            name="quantity"
            label="Paniers"
            type="number"
            min={1}
            max={Math.max(1, Math.min(10, remaining))}
            defaultValue={1}
            placeholder="Qté"
            disabled={soldOut}
            inputMode="numeric"
          />
          <CompactInput
            id="m-aw-name"
            name="name"
            label="Nom"
            placeholder="Nom"
            autoComplete="name"
            disabled={soldOut}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CompactInput
            id="m-aw-phone"
            name="phone"
            label="Téléphone"
            type="tel"
            placeholder="Téléphone"
            autoComplete="tel"
            inputMode="tel"
            disabled={soldOut}
          />
          <CompactInput
            id="m-aw-email"
            name="email"
            label="Email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            inputMode="email"
            disabled={soldOut}
          />
        </div>
        {state && !state.ok && (
          <p role="alert" className="text-xs text-red-400">
            {state.message}
          </p>
        )}
        <SubmitButton disabled={soldOut} compact />
      </form>

      <form action={formAction} className="hidden space-y-3 sm:block">
        <BotField />
        <div>
          <label htmlFor="aw-qty" className="mb-1 block text-xs text-cream/70">
            Nombre de paniers
          </label>
          <input
            id="aw-qty"
            name="quantity"
            type="number"
            min={1}
            max={Math.max(1, Math.min(10, remaining))}
            defaultValue={1}
            required
            disabled={soldOut}
            className={field}
          />
        </div>
        <input
          name="name"
          placeholder="Votre nom"
          required
          disabled={soldOut}
          className={field}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="phone"
            type="tel"
            placeholder="Téléphone"
            required
            disabled={soldOut}
            className={field}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            disabled={soldOut}
            className={field}
          />
        </div>
        {state && !state.ok && (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        )}
        <SubmitButton disabled={soldOut} />
        <p className="text-center text-xs text-muted">
          Paiement au retrait en boutique.
        </p>
      </form>
    </>
  );
}

function BotField() {
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

function CompactInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  min,
  max,
  defaultValue,
  autoComplete,
  inputMode,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  min?: number | string;
  max?: number | string;
  defaultValue?: number | string;
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
  disabled?: boolean;
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
        min={min}
        max={max}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        className={compactField}
      />
    </div>
  );
}
