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

export default function SurMesurePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-ink pb-20 pt-28">
        <div className="container-page max-w-4xl">
          <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
            <CakeSlice className="h-8 w-8 text-gold" />
            Gâteaux personnalisés
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Pour un anniversaire, un mariage ou un événement, créons ensemble le
            gâteau de vos rêves. Décrivez votre projet et joignez une photo
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
        </div>
      </main>
      <Footer />
    </>
  );
}
