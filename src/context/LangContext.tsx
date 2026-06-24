"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { translate, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "restaurant-locale";

interface LangContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const LangCtx = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      document.documentElement.lang = "fr";
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    void l;
    setLocaleState("fr");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      document.documentElement.lang = "fr";
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => translate(locale, key, fallback),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang doit être utilisé sous <LangProvider>");
  return ctx;
}
