import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MenuBrowser } from "@/components/MenuBrowser";
import { MenuHero } from "@/components/MenuHero";
import { getMenuForBrowser } from "@/lib/dishes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le Menu",
  description:
    "Découvrez toute notre carte africaine : entrées, thiéboudiène, yassa, mafé, attiéké, grillades, desserts et boissons maison.",
};

export default async function MenuPage() {
  const { categories, dishes } = await getMenuForBrowser();

  return (
    <>
      <Header />
      <main className="bg-ink pb-0 text-cream">
        <MenuHero />

        <div className="container-page">
          <MenuBrowser categories={categories} dishes={dishes} />
        </div>
      </main>
      <Footer />
    </>
  );
}
