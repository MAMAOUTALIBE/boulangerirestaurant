import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HomeShortcuts } from "@/components/HomeShortcuts";
import { FeaturedDishes } from "@/components/FeaturedDishes";
import { PremiumEngagementSection } from "@/components/PremiumEngagementSection";
import { Footer } from "@/components/Footer";
import { getContentSections } from "@/lib/content";
import { toHeroSlides, type ContentBlockData } from "@/lib/content-blocks";

// Rendu dynamique : la page lit la base (produits, avis, contenus éditoriaux)
// → pas de prérendu au build.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Le bandeau est un composant client (carrousel) : il reçoit ses diapositives
  // et ses raccourcis en props depuis ici plutôt que de lire la base lui-même.
  const sections = await getContentSections(["hero", "raccourcis"]);
  const diapos = toHeroSlides(sections.hero);
  const raccourcis = sections.raccourcis.filter(
    (bloc): bloc is ContentBlockData & { href: string } => Boolean(bloc.href),
  );

  return (
    <div className="home-page-mobile-viewport">
      <Header />
      <main className="home-page-main">
        <Hero slides={diapos} raccourcis={raccourcis} />
        <div className="home-page-sections">
          <HomeShortcuts />
          <FeaturedDishes />
          <PremiumEngagementSection />
        </div>
      </main>
      <div className="home-page-footer">
        <Footer />
      </div>
    </div>
  );
}
