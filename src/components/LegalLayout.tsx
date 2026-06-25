import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/** Gabarit commun aux pages légales (titre + contenu prose). */
export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-ink pb-20 pt-28">
        <div className="container-page max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-cream sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Dernière mise à jour : {updatedAt}
          </p>
          <div className="mt-8 space-y-6 leading-relaxed text-cream/85 [&_a]:text-gold [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-cream">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
