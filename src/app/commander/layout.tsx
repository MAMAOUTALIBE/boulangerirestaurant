import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Rendu dynamique : la page enfant lit `orderingMode` et l'identité via le
// contexte alimenté par la mise en page racine. Un prérendu au build figerait
// le mode vitrine par défaut — le restaurateur pourrait activer la commande
// dans le CRM sans que la page change jamais.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finaliser ma commande",
  description:
    "Validez votre commande chez Lawale Simbo : à emporter, en livraison ou sur place. Paiement sécurisé.",
};

export default function CommanderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
