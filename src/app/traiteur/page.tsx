import type { Metadata } from "next";
import { ChefHat, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CateringForm } from "@/components/CateringForm";

export const metadata: Metadata = {
  title: "Service traiteur",
  description:
    "Petits-déjeuners, entreprises, brunchs, événements : la boulangerie régale vos invités. Demandez un devis.",
};

const atouts = [
  "Plateaux viennoiseries, pains, pâtisseries et snacking",
  "Produits frais fabriqués en boutique",
  "Devis personnalisé sous 48 h",
  "De 10 à plusieurs centaines de convives",
];

const atoutsMobile = ["Entreprise", "Événement", "Devis 48h"];

export default function TraiteurPage() {
  return (
    <>
      <Header />
      <main className="bg-ink pb-0 pt-20 sm:pt-28">
        <div className="container-page max-w-4xl">
          <section className="flex flex-col justify-start pt-8 min-[390px]:pt-12 sm:hidden">
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

          <section className="hidden sm:block">
            <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
              <ChefHat className="h-8 w-8 text-gold" />
              Service traiteur
            </h1>
            <p className="mt-3 max-w-2xl text-muted">
              Pour vos mariages, événements d&apos;entreprise ou fêtes de
              famille, nous préparons pains, viennoiseries, pâtisseries et
              pièces salées. Décrivez votre projet, nous vous envoyons un devis
              sur mesure.
            </p>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <ul className="space-y-3">
                {atouts.map((a) => (
                  <li key={a} className="flex items-center gap-3 text-cream/85">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                      <Check className="h-4 w-4" />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-white/10 bg-ink-soft p-6 sm:p-8">
                <CateringForm />
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
