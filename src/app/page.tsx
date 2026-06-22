import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HomeShortcuts } from "@/components/HomeShortcuts";
import { FeaturedDishes } from "@/components/FeaturedDishes";
import { PremiumEngagementSection } from "@/components/PremiumEngagementSection";

// Rendu dynamique : la page lit la base (produits, avis) → pas de prérendu au build.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomeShortcuts />
        <FeaturedDishes />
        <PremiumEngagementSection />
      </main>
    </>
  );
}
