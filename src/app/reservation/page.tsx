import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReservationForm } from "@/components/ReservationForm";

export const metadata: Metadata = {
  title: "Réserver une table",
  description: "Réservez votre table à la boulangerie en quelques clics.",
};

const atoutsMobile = ["Confirmé", "Rapide", "Sans CB"];

function str(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v.slice(0, 120) : undefined;
}

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const defaults = {
    name: str(sp.name),
    phone: str(sp.phone),
    email: str(sp.email),
    date: str(sp.date),
    time: str(sp.time),
    guests: str(sp.guests),
    notes: str(sp.notes),
  };

  return (
    <>
      <Header />
      <main className="bg-ink pb-0 pt-20 sm:pt-28">
        <div className="container-page max-w-2xl">
          <section className="flex flex-col justify-start pt-8 min-[390px]:pt-12 sm:hidden">
            <h1 className="flex items-center gap-2 font-display text-[1.72rem] font-bold leading-tight text-cream">
              <CalendarCheck className="h-6 w-6 shrink-0 text-gold" />
              Réserver une table
            </h1>
            <p className="mt-1.5 text-[0.82rem] leading-5 text-muted min-[390px]:mt-2 min-[390px]:text-sm">
              Choisissez votre créneau, confirmation par email.
            </p>

            <ul className="mt-2.5 grid grid-cols-3 gap-1.5 min-[390px]:mt-3 min-[390px]:gap-2">
              {atoutsMobile.map((a) => (
                <li
                  key={a}
                  className="flex min-h-8 items-center justify-center gap-1 rounded-xl border border-gold/20 bg-gold/[0.07] px-2 text-center text-[0.68rem] font-semibold text-cream/85 min-[390px]:min-h-9 min-[390px]:text-[0.72rem]"
                >
                  <span className="text-gold">✓</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2.5 rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_42%),#111111] p-2.5 shadow-[0_22px_60px_-50px_rgba(245,158,11,0.75)] min-[390px]:mt-3 min-[390px]:p-3">
              <ReservationForm defaults={defaults} />
            </div>
          </section>

          <section className="hidden sm:block">
            <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
              <CalendarCheck className="h-8 w-8 text-gold" />
              Réserver une table
            </h1>
            <p className="mt-3 text-muted">
              Indiquez vos préférences : nous vous confirmons votre réservation
              par email dans les plus brefs délais.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-ink-soft p-6 sm:p-8">
              <ReservationForm defaults={defaults} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
