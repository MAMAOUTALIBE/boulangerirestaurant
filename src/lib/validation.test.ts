import { describe, it, expect } from "vitest";
import { contactSchema, newsletterSchema, orderSchema } from "@/lib/validation";

describe("newsletterSchema", () => {
  it("accepte un email valide", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.fr" }).success).toBe(true);
  });
  it("rejette un email invalide", () => {
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("rejette un message trop court", () => {
    const r = contactSchema.safeParse({
      name: "Jo",
      email: "a@b.fr",
      message: "court",
    });
    expect(r.success).toBe(false);
  });
});

describe("orderSchema", () => {
  it("rejette un panier vide", () => {
    const r = orderSchema.safeParse({
      name: "Jean Dupont",
      email: "a@b.fr",
      phone: "0612345678",
      items: [],
    });
    expect(r.success).toBe(false);
  });

  it("accepte une commande valide", () => {
    const r = orderSchema.safeParse({
      name: "Jean Dupont",
      email: "a@b.fr",
      phone: "0612345678",
      items: [
        { id: "x", name: "Croissant pur beurre", price: 1.6, quantity: 2 },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("exige une adresse complète pour la livraison", () => {
    const r = orderSchema.safeParse({
      name: "Jean Dupont",
      email: "a@b.fr",
      phone: "0612345678",
      fulfillment: "livraison",
      postalCode: "91260",
      items: [
        { id: "x", name: "Croissant pur beurre", price: 1.6, quantity: 2 },
      ],
    });

    expect(r.success).toBe(false);
  });

  it("accepte une livraison avec adresse complète", () => {
    const r = orderSchema.safeParse({
      name: "Jean Dupont",
      email: "a@b.fr",
      phone: "0612345678",
      fulfillment: "livraison",
      postalCode: "91260",
      address: "5 rue Jules Vallès — 91260 Juvisy-sur-Orge",
      items: [
        { id: "x", name: "Croissant pur beurre", price: 1.6, quantity: 2 },
      ],
    });

    expect(r.success).toBe(true);
  });
});
