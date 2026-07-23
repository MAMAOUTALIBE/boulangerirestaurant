import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GallerySection } from "@/components/GallerySection";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Galerie de nos spécialités africaines : thiéboudiène, yassa, mafé, attiéké, grillades et desserts préparés chaque jour.",
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
