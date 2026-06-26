import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactSection } from "@/components/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez notre restaurant turc pour une question, une commande ou une demande d'information.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="bg-ink pt-20 sm:pt-24">
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
