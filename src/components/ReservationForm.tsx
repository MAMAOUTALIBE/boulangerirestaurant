"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  Check,
  ChevronLeft,
  Clock,
  Download,
  Mail,
  MessageSquare,
  Minus,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import {
  cancelReservation,
  createReservation,
  type ReservationActionState,
} from "@/app/actions";
import {
  buildGoogleCalendarUrl,
  buildReservationIcs,
} from "@/lib/reservation-calendar";
import { useSiteConfig } from "@/context/SiteConfigContext";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-base text-cream placeholder:text-muted/80 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 sm:py-3";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/45 px-4 text-sm font-semibold text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70";

const TIME_SLOTS = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

export interface ReservationDefaults {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  date?: string;
  time?: string;
  guests?: string;
  notes?: string;
}

type ReservationResult = NonNullable<ReservationActionState["reservation"]>;

interface ReservationFormProps {
  defaults?: ReservationDefaults;
  initialReservation?: ReservationResult;
}

interface FormValues {
  date: string;
  time: string;
  guests: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reminderRequested: boolean;
}

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function splitDefaultName(name = ""): { firstName: string; lastName: string } {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

function formatDate(date: string): string {
  if (!date) return "Date non renseignée";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function SubmitButton({ updating }: { updating: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary min-h-11 w-full text-base disabled:opacity-60 sm:min-h-12"
    >
      {pending
        ? "Confirmation…"
        : updating
          ? "Enregistrer les modifications"
          : "Confirmer ma réservation"}
    </button>
  );
}

export function ReservationForm({
  defaults = {},
  initialReservation,
}: ReservationFormProps) {
  const siteConfig = useSiteConfig();
  const splitName = splitDefaultName(defaults.name);
  const initialValues: FormValues = initialReservation
    ? {
        date: initialReservation.date,
        time: initialReservation.time,
        guests: initialReservation.guests,
        notes: initialReservation.notes,
        firstName: initialReservation.firstName,
        lastName: initialReservation.lastName,
        email: initialReservation.email,
        phone: initialReservation.phone,
        reminderRequested: initialReservation.reminderRequested,
      }
    : {
        date: defaults.date ?? "",
        time: defaults.time ?? "",
        guests: Math.min(50, Math.max(1, Number(defaults.guests) || 2)),
        notes: defaults.notes ?? "",
        firstName: defaults.firstName ?? splitName.firstName,
        lastName: defaults.lastName ?? splitName.lastName,
        email: defaults.email ?? "",
        phone: defaults.phone ?? "",
        reminderRequested: true,
      };
  const initialActionState: ReservationActionState | null = initialReservation
    ? {
        ok: true,
        message:
          initialReservation.status === "annulée"
            ? "Cette réservation est annulée."
            : "Votre réservation est confirmée.",
        reservation: initialReservation,
      }
    : null;

  const [state, formAction] = useActionState<
    ReservationActionState | null,
    FormData
  >(createReservation, initialActionState);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [fullName, setFullName] = useState(
    `${initialValues.firstName} ${initialValues.lastName}`.trim(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [cancelled, setCancelled] = useState(
    initialReservation?.status === "annulée",
  );
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelPending, startCancelTransition] = useTransition();

  const activeReservation = state?.reservation ?? initialReservation;
  const updating = Boolean(activeReservation?.reference);

  useEffect(() => {
    if (!state?.errors) return;
    setErrors(state.errors);
    const contactFields = ["firstName", "lastName", "email", "phone"];
    setStep(contactFields.some((field) => state.errors?.[field]) ? 2 : 1);
  }, [state]);

  useEffect(() => {
    if (!state?.ok || !state.reservation) return;
    const reservation = state.reservation;
    setValues({
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      notes: reservation.notes,
      firstName: reservation.firstName,
      lastName: reservation.lastName,
      email: reservation.email,
      phone: reservation.phone,
      reminderRequested: reservation.reminderRequested,
    });
    setFullName(`${reservation.firstName} ${reservation.lastName}`.trim());
    setEditing(false);
    setCancelled(reservation.status === "annulée");
    const params = new URLSearchParams({
      reference: reservation.reference,
      token: reservation.manageToken,
    });
    window.history.replaceState(null, "", `/reservation?${params.toString()}`);
  }, [state]);

  const calendarUrl = useMemo(
    () =>
      activeReservation
        ? buildGoogleCalendarUrl(
            activeReservation,
            siteConfig.name,
            siteConfig.contact.address,
          )
        : "#",
    [activeReservation, siteConfig],
  );

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateFullName(value: string) {
    setFullName(value);
    setErrors((current) => {
      const next = { ...current };
      delete next.fullName;
      delete next.firstName;
      delete next.lastName;
      return next;
    });
  }

  function validateStep(target: 1 | 2): boolean {
    const next: Record<string, string> = {};
    if (target === 1) {
      if (!values.date) next.date = "Choisissez une date.";
      if (values.date && values.date < todayIso())
        next.date = "Choisissez une date à venir.";
      if (!values.time) next.time = "Choisissez un créneau.";
      if (values.guests < 1 || values.guests > 50)
        next.guests = "Choisissez entre 1 et 50 personnes.";
      if (values.notes.length > 2000)
        next.notes = "La demande est trop longue.";
    } else {
      const [firstName = "", ...lastNameParts] = fullName.trim().split(/\s+/);
      const lastName = lastNameParts.join(" ");
      if (firstName.length < 2 || lastName.length < 2) {
        next.fullName = "Saisissez votre nom et votre prénom.";
      } else {
        setValues((current) => ({ ...current, firstName, lastName }));
      }
      if (!/^\S+@\S+\.\S+$/.test(values.email))
        next.email = "Adresse e-mail invalide.";
      if (values.phone.replace(/\D/g, "").length < 6)
        next.phone = "Téléphone invalide.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function continueTo(nextStep: 2 | 3) {
    const current = nextStep === 2 ? 1 : 2;
    if (validateStep(current)) setStep(nextStep);
  }

  function beginEditing(target: 1 | 2) {
    setEditing(true);
    setErrors({});
    setStep(target);
  }

  function downloadCalendar() {
    if (!activeReservation) return;
    const blob = new Blob(
      [
        buildReservationIcs(
          activeReservation,
          siteConfig.name,
          siteConfig.contact.address,
        ),
      ],
      { type: "text/calendar;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservation-${activeReservation.reference}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function requestCancellation() {
    if (!activeReservation) return;
    if (!window.confirm("Voulez-vous vraiment annuler cette réservation ?"))
      return;
    startCancelTransition(async () => {
      const formData = new FormData();
      formData.set("reference", activeReservation.reference);
      formData.set("manageToken", activeReservation.manageToken);
      const result = await cancelReservation(formData);
      setCancelMessage(result.message);
      if (result.ok) setCancelled(true);
    });
  }

  if (cancelled) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/[0.08] p-5 text-center sm:p-8">
        <XCircle className="mx-auto h-12 w-12 text-red-300" />
        <h2 className="mt-3 font-display text-2xl font-bold text-cream">
          Réservation annulée
        </h2>
        <p className="mt-2 text-sm text-muted">
          {cancelMessage || "Cette réservation a bien été annulée."}
        </p>
        {activeReservation && (
          <p className="mt-3 font-mono text-sm text-cream/80">
            Référence {activeReservation.reference}
          </p>
        )}
      </div>
    );
  }

  if (state?.ok && activeReservation && !editing) {
    return (
      <div className="rounded-2xl border border-gold/35 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.15),transparent_42%),rgba(0,0,0,0.25)] p-5 text-center sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold text-ink">
          <Check className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-cream sm:text-3xl">
          Réservation confirmée
        </h2>
        <p className="mt-2 text-sm text-muted">
          Un e-mail de confirmation a été envoyé à {activeReservation.email}.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Référence
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-cream">
            {activeReservation.reference}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <SummaryLine
              label="Date et heure"
              value={`${formatDate(activeReservation.date)} à ${activeReservation.time}`}
            />
            <SummaryLine
              label="Table"
              value={`${activeReservation.guests} personne${activeReservation.guests > 1 ? "s" : ""}`}
            />
            <SummaryLine
              label="Nom"
              value={`${activeReservation.firstName} ${activeReservation.lastName}`}
            />
            <SummaryLine label="Téléphone" value={activeReservation.phone} />
          </dl>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryButton}
          >
            <CalendarPlus className="h-4 w-4" /> Google Agenda
          </a>
          <button
            type="button"
            onClick={downloadCalendar}
            className={secondaryButton}
          >
            <Download className="h-4 w-4" /> Télécharger le calendrier
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => beginEditing(1)}
            className={secondaryButton}
          >
            <Pencil className="h-4 w-4" /> Modifier
          </button>
          <button
            type="button"
            disabled={cancelPending}
            onClick={requestCancellation}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/40 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            {cancelPending ? "Annulation…" : "Annuler la réservation"}
          </button>
        </div>
        {cancelMessage && !cancelled && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {cancelMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="min-w-0 max-w-full space-y-3 sm:space-y-5"
    >
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <input type="hidden" name="date" value={values.date} />
      <input type="hidden" name="time" value={values.time} />
      <input type="hidden" name="guests" value={values.guests} />
      <input type="hidden" name="notes" value={values.notes} />
      <input type="hidden" name="firstName" value={values.firstName} />
      <input type="hidden" name="lastName" value={values.lastName} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="phone" value={values.phone} />
      <input
        type="hidden"
        name="reminderRequested"
        value={values.reminderRequested ? "on" : ""}
      />
      {activeReservation && (
        <>
          <input
            type="hidden"
            name="reservationReference"
            value={activeReservation.reference}
          />
          <input
            type="hidden"
            name="manageToken"
            value={activeReservation.manageToken}
          />
        </>
      )}

      <StepIndicator step={step} />

      {step === 1 && (
        <section
          aria-labelledby="reservation-step-1"
          className="min-w-0 max-w-full space-y-3 overflow-hidden sm:space-y-5"
        >
          <div>
            <h2
              id="reservation-step-1"
              className="font-display text-xl font-bold text-cream"
            >
              Date & heure
            </h2>
            <p className="mt-1 hidden text-sm text-muted sm:block">
              Choisissez votre créneau et le nombre de personnes.
            </p>
          </div>

          <FormField label="Date" error={errors.date} icon={CalendarCheck}>
            <input
              type="date"
              aria-label="Date"
              min={todayIso()}
              value={values.date}
              onChange={(event) => update("date", event.target.value)}
              className={`${inputClass} reservation-date-input block min-w-0 max-w-full overflow-hidden`}
              aria-invalid={Boolean(errors.date)}
            />
          </FormField>

          <div className="sm:hidden">
            <FormField label="Créneau" error={errors.time} icon={Clock}>
              <select
                aria-label="Créneau"
                value={values.time}
                onChange={(event) => update("time", event.target.value)}
                className={`${inputClass} cursor-pointer`}
                aria-invalid={Boolean(errors.time)}
              >
                <option value="">Choisissez une heure</option>
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <fieldset className="hidden sm:block">
            <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-cream/85">
              <Clock className="h-4 w-4 text-gold" /> Créneau
            </legend>
            <div className="grid grid-cols-3 gap-2 min-[430px]:grid-cols-4 sm:grid-cols-6">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => update("time", time)}
                  aria-pressed={values.time === time}
                  className={`min-h-11 rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 ${
                    values.time === time
                      ? "border-gold bg-gold/20 text-gold"
                      : "border-white/15 bg-white/[0.04] text-cream/80 hover:border-gold/50"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
            <FieldError error={errors.time} />
          </fieldset>

          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-cream/85">
              <Users className="h-4 w-4 text-gold" /> Nombre de personnes
            </p>
            <div className="flex min-h-12 items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-3 sm:min-h-14">
              <QuantityButton
                label="Retirer une personne"
                onClick={() => update("guests", Math.max(1, values.guests - 1))}
              >
                <Minus className="h-5 w-5" />
              </QuantityButton>
              <span className="text-lg font-semibold text-cream">
                {values.guests} personne{values.guests > 1 ? "s" : ""}
              </span>
              <QuantityButton
                label="Ajouter une personne"
                onClick={() =>
                  update("guests", Math.min(50, values.guests + 1))
                }
              >
                <Plus className="h-5 w-5" />
              </QuantityButton>
            </div>
            <FieldError error={errors.guests} />
          </div>

          <FormField
            label="Demande particulière (facultatif)"
            error={errors.notes}
            icon={MessageSquare}
          >
            <textarea
              aria-label="Demande particulière (facultatif)"
              rows={2}
              maxLength={2000}
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Anniversaire, allergie, emplacement préféré…"
              className={inputClass}
            />
          </FormField>

          <button
            type="button"
            onClick={() => continueTo(2)}
            className="btn-primary min-h-11 w-full text-base sm:min-h-12"
          >
            Continuer
          </button>
        </section>
      )}

      {step === 2 && (
        <section
          aria-labelledby="reservation-step-2"
          className="space-y-3 sm:space-y-4"
        >
          <div>
            <h2
              id="reservation-step-2"
              className="font-display text-xl font-bold text-cream"
            >
              Vos coordonnées
            </h2>
            <p className="mt-1 hidden text-sm text-muted sm:block">
              Elles servent uniquement à confirmer et gérer votre réservation.
            </p>
          </div>

          <FormField
            label="Nom et prénom"
            error={errors.fullName ?? errors.firstName ?? errors.lastName}
            icon={User}
          >
            <input
              type="text"
              aria-label="Nom et prénom"
              autoComplete="name"
              value={fullName}
              onChange={(event) => updateFullName(event.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Adresse e-mail" error={errors.email} icon={Mail}>
            <input
              type="email"
              aria-label="Adresse e-mail"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Téléphone" error={errors.phone} icon={Phone}>
            <input
              type="tel"
              aria-label="Téléphone"
              inputMode="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
              className={inputClass}
            />
          </FormField>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm text-cream/85 sm:p-4">
            <input
              type="checkbox"
              checked={values.reminderRequested}
              onChange={(event) =>
                update("reminderRequested", event.target.checked)
              }
              className="h-5 w-5 shrink-0 accent-gold"
            />
            <Bell className="h-5 w-5 shrink-0 text-gold" />
            Recevoir un rappel 2 h avant
          </label>

          <button
            type="button"
            onClick={() => continueTo(3)}
            className="btn-primary min-h-11 w-full text-base sm:min-h-12"
          >
            Vérifier ma réservation
          </button>
          <BackButton onClick={() => setStep(1)} />
        </section>
      )}

      {step === 3 && (
        <section
          aria-labelledby="reservation-step-3"
          className="space-y-3 sm:space-y-4"
        >
          <div>
            <h2
              id="reservation-step-3"
              className="font-display text-xl font-bold text-cream"
            >
              Vérifiez votre réservation
            </h2>
            <p className="mt-1 hidden text-sm text-muted sm:block">
              Relisez les informations avant de confirmer.
            </p>
          </div>

          <div className="divide-y divide-white/10 rounded-2xl border border-gold/30 bg-black/20 px-3 sm:px-4">
            <ReviewSection
              icon={CalendarCheck}
              title="Votre table"
              lines={[
                `${formatDate(values.date)} à ${values.time}`,
                `${values.guests} personne${values.guests > 1 ? "s" : ""}`,
                values.notes || "Aucune demande particulière",
              ]}
              onEdit={() => setStep(1)}
            />
            <ReviewSection
              icon={User}
              title="Vos coordonnées"
              lines={[
                fullName.trim(),
                values.email,
                values.phone,
                values.reminderRequested
                  ? "Rappel demandé 2 h avant"
                  : "Sans rappel",
              ]}
              onEdit={() => setStep(2)}
            />
          </div>

          {state && !state.ok && !state.errors && (
            <p role="alert" className="text-sm text-red-300">
              {state.message}
            </p>
          )}
          <SubmitButton updating={updating} />
          <BackButton onClick={() => setStep(2)} />
          <p className="hidden items-center justify-center gap-2 text-center text-xs text-muted sm:flex">
            <ShieldCheck className="h-4 w-4 text-gold" /> Sans paiement ·
            confirmation immédiate par e-mail
          </p>
        </section>
      )}
    </form>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Date & heure", "Coordonnées", "Confirmation"];
  return (
    <ol className="grid grid-cols-3 gap-1" aria-label={`Étape ${step} sur 3`}>
      {labels.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const complete = number < step;
        return (
          <li key={label} className="min-w-0 text-center">
            <span
              className={`mx-auto grid h-7 w-7 place-items-center rounded-full border text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
                active || complete
                  ? "border-gold bg-gold text-ink"
                  : "border-white/20 bg-white/[0.04] text-muted"
              }`}
            >
              {complete ? <Check className="h-4 w-4" /> : number}
            </span>
            <span
              className={`mt-0.5 block truncate text-[0.62rem] min-[390px]:text-[0.68rem] sm:mt-1 sm:text-xs ${active ? "font-semibold text-gold" : "text-muted"}`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function FormField({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0 max-w-full overflow-hidden">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-cream/85 sm:mb-2">
        <Icon className="h-4 w-4 text-gold" /> {label}
      </span>
      {children}
      <FieldError error={error} />
    </label>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? (
    <span role="alert" className="mt-1.5 block text-xs text-red-300">
      {error}
    </span>
  ) : null;
}

function QuantityButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border border-gold/60 text-gold transition hover:bg-gold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto flex items-center gap-1 text-sm font-semibold text-gold"
    >
      <ChevronLeft className="h-4 w-4" /> Retour
    </button>
  );
}

function ReviewSection({
  icon: Icon,
  title,
  lines,
  onEdit,
}: {
  icon: typeof User;
  title: string;
  lines: string[];
  onEdit: () => void;
}) {
  return (
    <div className="flex gap-2.5 py-2.5 sm:gap-3 sm:py-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-cream">{title}</p>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 sm:block">
          {lines.map((line) => (
            <p
              key={line}
              className="break-words text-xs text-muted sm:mt-1 sm:text-sm"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="self-start rounded-lg border border-gold/40 px-2.5 py-1.5 text-xs font-semibold text-gold"
      >
        Modifier
      </button>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 capitalize text-cream">{value}</dd>
    </div>
  );
}
