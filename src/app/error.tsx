"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journalisé côté serveur par Next.js ; on évite d'exposer le détail au client.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-cream">
      <p className="font-display text-6xl font-bold text-gold">Oups</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        Une erreur est survenue
      </h1>
      <p className="mt-3 max-w-md text-cream/70">
        Un problème inattendu s&apos;est produit. Vous pouvez réessayer ou
        revenir à l&apos;accueil. Si le problème persiste, contactez-nous.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-gold px-6 py-3 font-semibold text-ink transition hover:opacity-90"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-full border border-gold/40 px-6 py-3 font-semibold text-gold transition hover:bg-gold/10"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
