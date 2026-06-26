import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { CartProvider, useCart } from "@/context/CartContext";
import type { AddToCartInput } from "@/types";

const adana: AddToCartInput = {
  dishId: "adana-kebab",
  name: "Adana kebab",
  image: "/images/baklava.png",
  basePrice: 14.9,
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe("CartContext", () => {
  it("ajoute un article et calcule les totaux", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(adana));
    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalPrice).toBe(14.9);
  });

  it("incrémente la quantité d'une ligne identique", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(adana));
    act(() => result.current.addItem(adana));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPrice).toBe(29.8);
  });

  it("crée des lignes distinctes selon les options", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() =>
      result.current.addItem({
        ...adana,
        options: [
          { groupId: "g", optionId: "o1", label: "Riz pilaf", priceDelta: 0 },
        ],
      }),
    );
    act(() =>
      result.current.addItem({
        ...adana,
        options: [
          { groupId: "g", optionId: "o2", label: "Bulgur", priceDelta: 1 },
        ],
      }),
    );
    expect(result.current.items).toHaveLength(2);
    // 14.9 + (14.9 + 1)
    expect(result.current.totalPrice).toBe(30.8);
  });

  it("ajoute le surcoût des options au prix unitaire", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() =>
      result.current.addItem({
        ...adana,
        options: [
          { groupId: "g", optionId: "o3", label: "Fromage", priceDelta: 2 },
        ],
      }),
    );
    expect(result.current.items[0].unitPrice).toBe(16.9);
  });

  it("supprime une ligne quand la quantité tombe à 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(adana));
    const lineId = result.current.items[0].lineId;
    act(() => result.current.updateQuantity(lineId, 0));
    expect(result.current.items).toHaveLength(0);
  });

  it("persiste le panier dans localStorage", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(adana));
    const stored = JSON.parse(localStorage.getItem("restaurant-cart") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].dishId).toBe("adana-kebab");
  });

  it("vide le panier", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(adana));
    act(() => result.current.clear());
    expect(result.current.totalCount).toBe(0);
  });
});
