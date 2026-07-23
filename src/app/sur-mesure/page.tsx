import type { Metadata } from "next";
import Image from "next/image";
import { Check, UsersRound } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CustomQuoteForm } from "@/components/CustomQuoteForm";

export const metadata: Metadata = {
  title: "Plateaux & menus de groupe",
  description:
    "Composez un plateau ou un menu de groupe sur-mesure pour vos fêtes, repas de famille et événements d'entreprise : décrivez l'essentiel, recevez un devis personnalisé.",
};

const atouts = [
  "Anniversaires, fêtes de famille et événements d'entreprise",
  "Thiéboudiène, yassa, mafé, grillades et desserts au choix",
  "Cuisine africaine maison et produits frais",
  "Devis personnalisé après votre demande",
];

const atoutsMobile = ["Sur-mesure", "Maison", "Devis rapide"];

const inspirations = ["Plateau africain", "Menu découverte", "Buffet de fête"];

export default function SurMesurePage() {
  return (
    <>
      <Header />
      <main className="bg-ink pb-0 pt-20 sm:pt-28">
        <div className="container-page max-w-6xl">
          <section className="flex flex-col justify-start pt-5 min-[390px]:pt-7 sm:hidden">
            <h1 className="flex items-center gap-2 font-display text-[1.72rem] font-bold leading-tight text-cream">
              <UsersRound className="h-6 w-6 shrink-0 text-gold" />
              Plateaux & menus de groupe
            </h1>
            <p className="mt-1.5 text-[0.82rem] leading-5 text-muted min-[390px]:mt-2 min-[390px]:text-sm">
              Décrivez l&apos;essentiel, devis sur mesure.
            </p>

            <ul className="mt-2.5 grid grid-cols-3 gap-1.5 min-[390px]:mt-3 min-[390px]:gap-2">
              {atoutsMobile.map((a) => (
                <li
                  key={a}
                  className="flex min-h-8 items-center justify-center gap-1 rounded-xl border border-gold/20 bg-gold/[0.07] px-2 text-center text-[0.68rem] font-semibold text-cream/85 min-[390px]:min-h-9 min-[390px]:text-[0.72rem]"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-gold" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2.5 rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_42%),#111111] p-2.5 shadow-[0_22px_60px_-50px_rgba(245,158,11,0.75)] min-[390px]:mt-3 min-[390px]:p-3">
              <CustomQuoteForm />
            </div>
          </section>

          <section className="hidden sm:block">
            <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
              <UsersRound className="h-8 w-8 text-gold" />
              Plateaux & menus de groupe
            </h1>
            <p className="mt-3 max-w-3xl text-muted">
              Pour un anniversaire, un repas de famille ou un événement
              d&apos;entreprise, composons ensemble votre plateau ou menu de
              groupe. Décrivez l&apos;essentiel en quelques lignes : nous vous
              envoyons un devis sur mesure.
            </p>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
              <div className="space-y-5">
                <figure className="overflow-hidden rounded-[28px] border border-gold/25 bg-white/[0.03] shadow-[0_28px_90px_-60px_rgba(245,158,11,0.75)]">
                  <div className="relative aspect-[16/9]">
                    <Image
                      src="/images/africain/attieke-poisson-alloco.webp"
                      alt="Grand plateau africain à partager avec poisson, attiéké et alloco"
                      fill
                      priority
                      sizes="(min-width: 1024px) 54vw, 100vw"
                      className="object-cover"
                    />
                    <div className="from-black/72 absolute inset-0 bg-gradient-to-t via-black/10 to-transparent" />
                    <div className="absolute inset-x-5 bottom-5 flex flex-wrap gap-2">
                      {inspirations.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs font-bold text-cream backdrop-blur-md"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </figure>

                <ul className="grid gap-3 md:grid-cols-2">
                  {atouts.map((a) => (
                    <li
                      key={a}
                      className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-medium leading-5 text-cream/85"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                        <Check className="h-4 w-4" />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-ink-soft p-6 shadow-[0_28px_85px_-62px_rgba(0,0,0,0.95)]">
                <div className="mb-3 border-b border-white/10 pb-3">
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-gold">
                    Devis rapide
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted">
                    Quelques informations suffisent pour préparer une réponse
                    personnalisée.
                  </p>
                </div>
                <CustomQuoteForm />
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
