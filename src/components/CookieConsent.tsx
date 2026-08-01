"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "restaurant-turc-cookie-consent";

/** Bandeau de consentement cookies (RGPD), persisté en localStorage. */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const compactHome = pathname === "/";

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
          className={`fixed inset-x-3 z-[60] mx-auto max-w-md rounded-2xl border border-white/10 bg-ink-soft shadow-card sm:inset-x-auto sm:bottom-6 sm:left-6 sm:top-auto sm:mx-0 sm:max-w-[34rem] sm:p-4 lg:max-w-[38rem] ${compactHome ? "top-[72px] p-2.5" : "bottom-3 p-3"}`}
        >
          <p
            className={`text-cream/85 sm:text-sm ${compactHome ? "text-[0.68rem] leading-snug" : "text-xs leading-relaxed"}`}
          >
            <span className="sm:hidden">
              Cookie nécessaire au site. Mesure d&apos;audience avec
              accord.{" "}
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
          <div
            className={`flex shrink-0 gap-2 ${compactHome ? "mt-2" : "mt-3"}`}
          >
            <button
              type="button"
              onClick={() => decide("refused")}
              className={`flex-1 rounded-full border border-white/15 px-4 text-cream transition hover:border-white/40 sm:min-h-11 sm:flex-none sm:text-sm ${compactHome ? "min-h-9 text-xs" : "min-h-11 text-sm"}`}
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={() => decide("accepted")}
              className={`flex-1 rounded-full bg-gold px-4 font-semibold text-ink transition hover:bg-gold-400 sm:min-h-11 sm:flex-none sm:text-sm ${compactHome ? "min-h-9 text-xs" : "min-h-11 text-sm"}`}
            >
              Accepter
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
