import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-ink px-6 pt-24 text-center text-cream">
        <p className="font-display text-7xl font-bold text-gold">404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">
          Cette page n&apos;existe pas
        </h1>
        <p className="mt-3 max-w-md text-cream/70">
          La page que vous cherchez a peut-être été déplacée ou n&apos;est plus
          disponible. Retournez à l&apos;accueil ou découvrez notre menu.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-gold px-6 py-3 font-semibold text-ink transition hover:opacity-90"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/menu"
            className="rounded-full border border-gold/40 px-6 py-3 font-semibold text-gold transition hover:bg-gold/10"
          >
            Voir le menu
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
