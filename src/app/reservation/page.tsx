import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReservationForm } from "@/components/ReservationForm";

export const metadata: Metadata = {
  title: "Réserver une table",
  description: "Réservez votre table à la boulangerie en quelques clics.",
};

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
      <main className="min-h-screen bg-ink pb-20 pt-28">
        <div className="container-page max-w-2xl">
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
        </div>
      </main>
      <Footer />
    </>
  );
}
