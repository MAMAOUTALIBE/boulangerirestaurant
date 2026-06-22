"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Fulfillment } from "@/types";

const STORAGE_KEY = "restaurant-order-ctx";

export interface OrderChoice {
  fulfillment: Fulfillment;
  postalCode?: string;
  /** ISO du créneau choisi, ou null = dès que possible. */
  scheduledAt: string | null;
  /** Libellé lisible (« Aujourd'hui 19:30 » / « Dès que possible »). */
  label: string;
}

interface OrderContextValue {
  choice: OrderChoice | null;
  setChoice: (c: OrderChoice) => void;
  clearChoice: () => void;
}

const OrderCtx = createContext<OrderContextValue | null>(null);

/** Mémorise le mode de commande et le créneau choisis (persisté). */
export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoiceState] = useState<OrderChoice | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setChoiceState(JSON.parse(raw) as OrderChoice);
    } catch {
      /* ignore */
    }
  }, []);

  const setChoice = useCallback((c: OrderChoice) => {
    setChoiceState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch {
      /* ignore */
    }
  }, []);

  const clearChoice = useCallback(() => {
    setChoiceState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ choice, setChoice, clearChoice }),
    [choice, setChoice, clearChoice],
  );
  return <OrderCtx.Provider value={value}>{children}</OrderCtx.Provider>;
}

export function useOrderChoice(): OrderContextValue {
  const ctx = useContext(OrderCtx);
  if (!ctx) throw new Error("useOrderChoice doit être sous <OrderProvider>");
  return ctx;
}
