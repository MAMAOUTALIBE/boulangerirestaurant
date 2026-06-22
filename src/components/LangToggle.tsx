"use client";

import { useLang } from "@/context/LangContext";

/** Bascule FR / EN. */
export function LangToggle() {
  const { locale, setLocale } = useLang();
  return (
    <div className="flex items-center rounded-full border border-white/10 text-xs font-semibold">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2.5 py-1 uppercase transition ${
            locale === l ? "bg-gold text-ink" : "text-cream/70 hover:text-cream"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
