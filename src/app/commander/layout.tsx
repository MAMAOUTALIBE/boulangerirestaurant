import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Finaliser ma commande",
  description:
    "Validez votre commande chez Lauuale Simbo : à emporter, en livraison ou sur place. Paiement sécurisé.",
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
