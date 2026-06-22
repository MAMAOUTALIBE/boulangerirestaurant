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

export default function TraiteurPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-ink pb-20 pt-28">
        <div className="container-page max-w-4xl">
          <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-cream sm:text-4xl">
            <ChefHat className="h-8 w-8 text-gold" />
            Service traiteur
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Pour vos mariages, événements d&apos;entreprise ou fêtes de famille,
            nous préparons pains, viennoiseries, pâtisseries et pièces salées.
            Décrivez votre projet, nous vous envoyons un devis sur mesure.
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
        </div>
      </main>
      <Footer />
    </>
  );
}
