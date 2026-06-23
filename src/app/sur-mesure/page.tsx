import type { Metadata } from "next";
import { CakeSlice, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CustomCakeForm } from "@/components/CustomCakeForm";

export const metadata: Metadata = {
  title: "Gâteaux personnalisés",
  description:
    "Commandez un gâteau sur mesure pour vos anniversaires, mariages et événements : occasion, parts, parfum, message et photo d'inspiration. Devis personnalisé.",
};

const atouts = [
  "Anniversaires, mariages, baptêmes et événements d'entreprise",
  "Parfums et décors personnalisés, message sur le gâteau",
  "Fabrication artisanale, produits frais",
  "Devis personnalisé après votre demande",
];

const atoutsMobile = ["Sur-mesure", "Maison", "Devis rapide"];

export default function SurMesurePage() {
  return (
    <>
      <Header />
      <main className="bg-ink pb-0 pt-20 sm:pt-28">
        <div className="container-page max-w-4xl">
          <section className="flex flex-col justify-start pt-8 min-[390px]:pt-12 sm:hidden">
            <h1 className="flex items-center gap-2 font-display text-[1.72rem] font-bold leading-tight text-cream">
              <CakeSlice className="h-6 w-6 shrink-0 text-gold" />
              Gâteaux personnalisés
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
              <CustomCakeForm />
            </div>
          </section>

          <section className="hidden sm:block">
            <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
              <CakeSlice className="h-8 w-8 text-gold" />
              Gâteaux personnalisés
            </h1>
            <p className="mt-3 max-w-2xl text-muted">
              Pour un anniversaire, un mariage ou un événement, créons ensemble
              le gâteau de vos rêves. Décrivez votre projet et joignez une photo
              d&apos;inspiration : nous vous envoyons un devis sur mesure.
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
                <CustomCakeForm />
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
