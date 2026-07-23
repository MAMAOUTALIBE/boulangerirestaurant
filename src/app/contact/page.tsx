import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { ContactSection } from "@/components/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Lauuale Simbo pour une question, une commande ou une demande d'information.",
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
