"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "boulangerie-cookie-consent";

/** Bandeau de consentement cookies (RGPD), persisté en localStorage. */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage indisponible : on n'affiche rien.
    }
  }, []);

  function decide(choice: "accepted" | "refused") {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Consentement aux cookies"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-white/10 bg-ink-soft p-3 shadow-card sm:max-w-3xl sm:flex sm:items-center sm:gap-5 sm:p-5"
        >
          <p className="text-xs leading-relaxed text-cream/85 sm:text-sm">
            <span className="sm:hidden">
              Cookie nécessaire au site. Mesure d&apos;audience avec accord.{" "}
            </span>
            <span className="hidden sm:inline">
              Nous utilisons un cookie strictement nécessaire au fonctionnement
              du site. Avec votre accord, nous pourrons aussi mesurer
              l&apos;audience.{" "}
            </span>
            <a href="/confidentialite" className="text-gold underline">
              En savoir plus
            </a>
            .
          </p>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button
              onClick={() => decide("refused")}
              className="min-h-11 flex-1 rounded-full border border-white/15 px-4 text-sm text-cream transition hover:border-white/40 sm:flex-none"
            >
              Refuser
            </button>
            <button
              onClick={() => decide("accepted")}
              className="min-h-11 flex-1 rounded-full bg-gold px-4 text-sm font-semibold text-ink transition hover:bg-gold-400 sm:flex-none"
            >
              Accepter
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
