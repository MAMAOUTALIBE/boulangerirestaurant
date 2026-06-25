import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GallerySection } from "@/components/GallerySection";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Galerie photos et vidéos de la boulangerie : pains au levain, viennoiseries, pâtisseries et gâteaux sur-mesure préparés chaque jour.",
};

export default function GaleriePage() {
  return (
    <>
      <Header />
      <main className="bg-ink pt-20 sm:pt-28">
        <GallerySection />
      </main>
      <Footer />
    </>
  );
}
