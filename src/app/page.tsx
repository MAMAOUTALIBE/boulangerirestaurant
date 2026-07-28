import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HomeShortcuts } from "@/components/HomeShortcuts";
import { FeaturedDishes } from "@/components/FeaturedDishes";
import { PremiumEngagementSection } from "@/components/PremiumEngagementSection";
import { Footer } from "@/components/Footer";
import { getContentSection } from "@/lib/content";
import { toHeroSlides } from "@/lib/content-blocks";

// Rendu dynamique : la page lit la base (produits, avis, contenus éditoriaux)
// → pas de prérendu au build.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Le bandeau est un composant client (carrousel) : il reçoit ses diapositives
  // en props depuis ici plutôt que de lire la base lui-même.
  const diapos = toHeroSlides(await getContentSection("hero"));

  return (
    <>
      <Header />
      <main>
        <Hero slides={diapos} />
        <HomeShortcuts />
        <FeaturedDishes />
        <PremiumEngagementSection />
      </main>
      <Footer />
    </>
  );
}
