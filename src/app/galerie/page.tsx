import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GallerySection } from "@/components/GallerySection";
import { getContentSection } from "@/lib/content";
import { toGalleryEntries } from "@/lib/content-blocks";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Galerie de nos spécialités africaines : thiéboudiène, yassa, mafé, attiéké, grillades et desserts préparés chaque jour.",
};

// Les médias viennent de la base (éditables depuis /admin/contenus) : la page
// ne peut donc plus être figée à la construction.
export const dynamic = "force-dynamic";

export default async function GaleriePage() {
  const medias = toGalleryEntries(await getContentSection("galerie"));

  return (
    <>
      <Header />
      <main className="bg-ink pt-20 sm:pt-28">
        <GallerySection items={medias} />
      </main>
      <Footer />
    </>
  );
}
