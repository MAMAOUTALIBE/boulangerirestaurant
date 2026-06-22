import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MenuBrowser } from "@/components/MenuBrowser";
import { Reveal } from "@/components/ui/Reveal";
import { getMenuForBrowser } from "@/lib/dishes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le Menu",
  description:
    "Découvrez toute la carte de la boulangerie : pains artisanaux, viennoiseries, pâtisseries, snacking et boissons.",
};

export default async function MenuPage() {
  const { categories, dishes } = await getMenuForBrowser();

  return (
    <>
      <Header />
      <main className="bg-ink pb-20 text-cream">
        {/* Hero sombre, cohérent avec le reste du site, pour donner de la respiration */}
        <section className="relative overflow-hidden bg-hero-radial pb-10 pt-32 sm:pb-12">
          <div className="absolute inset-0 bg-kente opacity-50" aria-hidden />
          <div className="container-page relative">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
                Notre carte
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold text-cream sm:text-5xl">
                Le Menu
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-cream/60">
                Pains au levain, viennoiseries pur beurre, pâtisseries de
                saison, snacking et boissons, préparés chaque jour avec des
                produits frais.
              </p>
            </Reveal>
          </div>
        </section>

        <div className="container-page">
          <MenuBrowser categories={categories} dishes={dishes} />
        </div>
      </main>
      <Footer />
    </>
  );
}
