import type { Metadata } from "next";
import Image from "next/image";
import { ChefHat, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CateringForm } from "@/components/CateringForm";

export const metadata: Metadata = {
  title: "Service traiteur",
  description:
    "Repas de famille, événements d'entreprise, fêtes et réceptions : nos spécialités africaines régalent vos invités. Demandez un devis.",
};

const atouts = [
  "Plateaux africains & grillades",
  "Produits frais maison",
  "Devis sous 48 h",
  "10 à 300+ convives",
];

const atoutsMobile = ["Entreprise", "Événement", "Devis 48h"];

export default function TraiteurPage() {
  return (
    <>
      <Header />
      <main className="bg-ink pb-0 pt-20 sm:pt-28">
        <div className="container-page max-w-4xl sm:max-w-5xl">
          <section className="flex flex-col justify-start pt-5 min-[390px]:pt-7 sm:hidden">
            <h1 className="flex items-center gap-2 font-display text-[1.72rem] font-bold leading-tight text-cream">
              <ChefHat className="h-6 w-6 shrink-0 text-gold" />
              Service traiteur
            </h1>
            <p className="mt-1.5 text-[0.82rem] leading-5 text-muted min-[390px]:mt-2 min-[390px]:text-sm">
              Décrivez l&apos;essentiel, devis sous 48 h.
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
              <CateringForm />
            </div>
          </section>

          <section className="hidden sm:block sm:pb-8 sm:pt-2">
            <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
              <ChefHat className="h-8 w-8 text-gold" />
              Service traiteur
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted lg:text-base">
              Pour vos mariages, événements d&apos;entreprise ou fêtes de
              famille, nous préparons thiéboudiène, yassa, mafé, grillades,
              accompagnements et douceurs africaines. Décrivez votre projet,
              nous vous envoyons un devis sur mesure.
            </p>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(216,154,28,0.12),transparent_38%),#111111] shadow-[0_28px_85px_-62px_rgba(0,0,0,0.95)] lg:grid lg:h-[calc(100svh-17rem)] lg:max-h-[31rem] lg:min-h-[28rem] lg:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-[20rem] lg:min-h-0">
                <Image
                  src="/images/africain/thiep-poulet.webp"
                  alt="Plateaux traiteur de plats et spécialités africaines"
                  fill
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-gold">
                    Réceptions & entreprises
                  </p>
                  <p className="mt-1 font-display text-lg font-bold leading-tight text-cream lg:text-xl">
                    Formats prêts à servir, sur mesure.
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between p-4 lg:p-5">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {atouts.map((a) => (
                    <li
                      key={a}
                      className="flex min-h-11 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-5 text-cream/85"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>

                <div className="mt-3.5 rounded-2xl border border-white/10 bg-black/20 p-3.5 lg:p-4">
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.24em] text-gold">
                    Devis rapide
                  </p>
                  <CateringForm />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
