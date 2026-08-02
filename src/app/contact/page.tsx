import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { ContactSection } from "@/components/ContactSection";

// Rendu dynamique : la page affiche l'identité du restaurant (coordonnées,
// horaires) lue en base. Sans cela elle serait figée au build — or la base
// n'est pas joignable pendant le build Docker, ce qui gèlerait les valeurs
// par défaut du template et rendrait le CRM sans effet sur cette page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Lawale Simbo pour une question, une commande ou une demande d'information.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="bg-ink pt-[6rem] sm:pt-[6.75rem] lg:h-svh lg:overflow-hidden lg:pt-[7rem] 2xl:pt-[7.35rem]">
        <ContactSection />
      </main>
    </>
  );
}
