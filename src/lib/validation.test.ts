import { describe, it, expect } from "vitest";
import {
  cartTrackingSchema,
  contactSchema,
  customQuoteSchema,
  newsletterSchema,
  orderSchema,
} from "@/lib/validation";

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
      phone: "0612345678",
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
      items: [{ id: "x", name: "Adana kebab", price: 14.9, quantity: 2 }],
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
      items: [{ id: "x", name: "Adana kebab", price: 14.9, quantity: 2 }],
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
      items: [{ id: "x", name: "Adana kebab", price: 14.9, quantity: 2 }],
    });

    expect(r.success).toBe(true);
  });

  it("rejette une quantité démesurée (borne anti-abus)", () => {
    const r = orderSchema.safeParse({
      name: "Jean Dupont",
      email: "a@b.fr",
      phone: "0612345678",
      items: [{ id: "x", name: "Adana kebab", price: 14.9, quantity: 1_000_000 }],
    });
    expect(r.success).toBe(false);
  });

  it("rejette un pourboire hors borne", () => {
    const r = orderSchema.safeParse({
      name: "Jean Dupont",
      email: "a@b.fr",
      phone: "0612345678",
      tip: 999_999,
      items: [{ id: "x", name: "Adana kebab", price: 14.9, quantity: 1 }],
    });
    expect(r.success).toBe(false);
  });
});

describe("customQuoteSchema — inspirationUrl", () => {
  const base = {
    name: "Jean Dupont",
    email: "a@b.fr",
    phone: "0612345678",
    occasion: "Anniversaire",
    servings: 10,
    preferences: "Sans porc",
    pickupDate: "2026-08-01",
    details: "Un beau plateau de mezze pour la fête.",
  };
  it("rejette un lien javascript:", () => {
    const r = customQuoteSchema.safeParse({
      ...base,
      inspirationUrl: "javascript:alert(1)",
    });
    expect(r.success).toBe(false);
  });
  it("accepte un lien https", () => {
    const r = customQuoteSchema.safeParse({
      ...base,
      inspirationUrl: "https://pinterest.com/idee",
    });
    expect(r.success).toBe(true);
  });
});

describe("cartTrackingSchema — email", () => {
  it("ignore une pseudo-adresse invalide (anti-pollution de leads)", () => {
    const r = cartTrackingSchema.safeParse({
      cartId: "c-123",
      email: "=HYPERLINK(evil)",
      items: [],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBeUndefined();
  });
  it("conserve et normalise une adresse valide", () => {
    const r = cartTrackingSchema.safeParse({
      cartId: "c-123",
      email: "Client@Example.COM",
      items: [],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("client@example.com");
  });
});
