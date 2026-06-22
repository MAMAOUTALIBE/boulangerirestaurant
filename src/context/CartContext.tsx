"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AddToCartInput, CartItem } from "@/types";

const STORAGE_KEY = "restaurant-cart";
const CART_ID_KEY = "restaurant-cart-id";

/** Construit une clé de ligne stable à partir du plat, des options et de la note. */
function buildLineId(input: AddToCartInput): string {
  const opts = (input.options ?? [])
    .map((o) => o.optionId)
    .sort()
    .join(",");
  return `${input.dishId}::${opts}::${input.note ?? ""}`;
}

interface CartContextValue {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (input: AddToCartInput, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
  /** Identifiant anonyme du panier (suivi serveur / funnel). */
  cartId: string;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Fournit l'état global du panier, persisté en localStorage. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [cartId, setCartId] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
      let id = window.localStorage.getItem(CART_ID_KEY);
      if (!id) {
        id =
          window.crypto?.randomUUID?.() ??
          `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        window.localStorage.setItem(CART_ID_KEY, id);
      }
      setCartId(id);
    } catch {
      // localStorage indisponible ou JSON corrompu → on ignore.
    }
    setHydrated(true);
  }, []);

  // Synchronisation serveur du panier (debounced) pour le funnel de conversion.
  useEffect(() => {
    if (!hydrated || !cartId) return;
    const t = setTimeout(() => {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
        keepalive: true,
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [items, hydrated, cartId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Quota dépassé ou mode privé → on ignore.
    }
  }, [items, hydrated]);

  const addItem = useCallback((input: AddToCartInput, quantity = 1) => {
    const options = input.options ?? [];
    const unitPrice =
      input.basePrice + options.reduce((s, o) => s + o.priceDelta, 0);
    const lineId = buildLineId(input);

    setItems((prev) => {
      const existing = prev.find((i) => i.lineId === lineId);
      if (existing) {
        return prev.map((i) =>
          i.lineId === lineId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [
        ...prev,
        {
          lineId,
          dishId: input.dishId,
          name: input.name,
          image: input.image,
          basePrice: input.basePrice,
          unitPrice,
          quantity,
          options,
          note: input.note,
        },
      ];
    });
    setOpen(true);
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.lineId !== lineId)
        : prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      open,
      setOpen,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      totalCount,
      totalPrice,
      cartId,
    }),
    [
      items,
      open,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      totalCount,
      totalPrice,
      cartId,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Hook d'accès au panier. Doit être utilisé sous <CartProvider>. */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error(
      "useCart doit être utilisé à l'intérieur de <CartProvider>",
    );
  }
  return ctx;
}
