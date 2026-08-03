import type { Metadata } from "next";
import Image from "next/image";
import { CalendarCheck, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReservationForm } from "@/components/ReservationForm";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Réserver une table",
  description: "Réservez votre table chez Lawale Simbo en quelques clics.",
};

const atoutsDesktop = [
  "Confirmation par email",
  "Créneau midi ou soir",
  "Sans paiement en ligne",
];

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
  const reference = str(sp.reference);
  const token = str(sp.token);
  const existing =
    reference && token
      ? await prisma.reservation.findFirst({
          where: { reference, manageToken: token },
        })
      : null;
  const defaults = {
    name: str(sp.name),
    firstName: str(sp.firstName),
    lastName: str(sp.lastName),
    phone: str(sp.phone),
    email: str(sp.email),
    date: str(sp.date),
    time: str(sp.time),
    guests: str(sp.guests),
    notes: str(sp.notes),
  };
  const initialReservation =
    existing && existing.manageToken
      ? {
          reference: existing.reference,
          manageToken: existing.manageToken,
          firstName: existing.firstName,
          lastName: existing.lastName,
          email: existing.email,
          phone: existing.phone,
          date: existing.date,
          time: existing.time,
          guests: existing.guests,
          notes: existing.notes ?? "",
          reminderRequested: existing.reminderRequested,
          status: existing.status,
        }
      : undefined;

  return (
    <>
      <Header />
      <main className="h-[100dvh] overflow-hidden bg-ink pb-0 pt-20 sm:h-auto sm:min-h-[100dvh] sm:overflow-visible sm:pt-28">
        <div className="container-page max-w-2xl sm:max-w-5xl">
          <section className="flex h-[calc(100dvh-5rem)] flex-col justify-start pt-1.5 sm:hidden">
            <h1 className="sr-only">Réserver une table</h1>
            <div className="max-h-full overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_42%),#111111] p-2.5 shadow-[0_22px_60px_-50px_rgba(245,158,11,0.75)]">
              <ReservationForm
                defaults={defaults}
                initialReservation={initialReservation}
              />
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

            <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(216,154,28,0.12),transparent_38%),#111111] shadow-[0_28px_85px_-62px_rgba(0,0,0,0.95)] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-[28rem]">
                <Image
                  src="/images/africain/thiep-poisson.webp"
                  alt="Thiéboudiène servi chez Lawale Simbo"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
                    Sur place
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-cream">
                    Une table pour un bon repas africain.
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    {atoutsDesktop.map((atout) => (
                      <li
                        key={atout}
                        className="flex items-center gap-2 text-sm text-cream/80"
                      >
                        <Check className="h-4 w-4 text-gold" />
                        {atout}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-gold">
                    Demande rapide
                  </p>
                  <ReservationForm
                    defaults={defaults}
                    initialReservation={initialReservation}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}
