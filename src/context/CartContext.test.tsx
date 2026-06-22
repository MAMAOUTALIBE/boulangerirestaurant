import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { CartProvider, useCart } from "@/context/CartContext";
import type { AddToCartInput } from "@/types";

const croissant: AddToCartInput = {
  dishId: "croissant-beurre",
  name: "Croissant pur beurre",
  image: "/images/boulangerie-viennoiseries.webp",
  basePrice: 1.6,
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe("CartContext", () => {
  it("ajoute un article et calcule les totaux", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(croissant));
    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalPrice).toBe(1.6);
  });

  it("incrémente la quantité d'une ligne identique", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(croissant));
    act(() => result.current.addItem(croissant));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPrice).toBe(3.2);
  });

  it("crée des lignes distinctes selon les options", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() =>
      result.current.addItem({
        ...croissant,
        options: [
          { groupId: "g", optionId: "o1", label: "Nature", priceDelta: 0 },
        ],
      }),
    );
    act(() =>
      result.current.addItem({
        ...croissant,
        options: [
          { groupId: "g", optionId: "o2", label: "Amandes", priceDelta: 1 },
        ],
      }),
    );
    expect(result.current.items).toHaveLength(2);
    // 1.6 + (1.6 + 1)
    expect(result.current.totalPrice).toBe(4.2);
  });

  it("ajoute le surcoût des options au prix unitaire", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() =>
      result.current.addItem({
        ...croissant,
        options: [
          { groupId: "g", optionId: "o3", label: "Chocolat", priceDelta: 2 },
        ],
      }),
    );
    expect(result.current.items[0].unitPrice).toBe(3.6);
  });

  it("supprime une ligne quand la quantité tombe à 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(croissant));
    const lineId = result.current.items[0].lineId;
    act(() => result.current.updateQuantity(lineId, 0));
    expect(result.current.items).toHaveLength(0);
  });

  it("persiste le panier dans localStorage", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(croissant));
    const stored = JSON.parse(localStorage.getItem("restaurant-cart") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].dishId).toBe("croissant-beurre");
  });

  it("vide le panier", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(croissant));
    act(() => result.current.clear());
    expect(result.current.totalCount).toBe(0);
  });
});
