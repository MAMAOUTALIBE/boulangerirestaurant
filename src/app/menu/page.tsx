import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MenuBrowser } from "@/components/MenuBrowser";
import { MenuHero } from "@/components/MenuHero";
import { getMenuForBrowser } from "@/lib/dishes";
import { getContentSection } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le Menu",
  description:
    "Découvrez toute notre carte africaine : entrées, thiéboudiène, yassa, mafé, attiéké, grillades, desserts et boissons maison.",
};

export default async function MenuPage() {
  const [{ categories, dishes }, bandeau] = await Promise.all([
    getMenuForBrowser(),
    getContentSection("menu-hero"),
  ]);
  // Le bandeau est un composant client : ses images lui arrivent en props.
  const diapos = bandeau
    .filter((bloc) => bloc.mediaUrl)
    .map((bloc) => ({
      src: bloc.mediaUrl as string,
      alt: bloc.alt ?? bloc.title ?? "",
    }));

  return (
    <>
      <Header />
      <main className="bg-ink pb-0 text-cream">
        <MenuHero slides={diapos} />

        <div className="container-page">
          <MenuBrowser categories={categories} dishes={dishes} />
        </div>
      </main>
      <Footer />
    </>
  );
}
