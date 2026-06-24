import { describe, expect, it } from "vitest";
import {
  buildTelegramOrderUrl,
  buildWhatsAppOrderUrl,
  formatSocialOrderMessage,
} from "@/lib/social-order";
import type { CartItem } from "@/types";

const item: CartItem = {
  lineId: "sandwich-1",
  dishId: "sandwich-baguette-poulet",
  name: "Sandwich baguette poulet",
  image: "/images/boulangerie-snacking.webp",
  basePrice: 6.9,
  unitPrice: 7.9,
  quantity: 2,
  options: [
    {
      groupId: "pain",
      optionId: "complet",
      label: "Pain complet",
      priceDelta: 1,
    },
  ],
  note: "Sans tomate",
};

describe("social order helpers", () => {
  it("formate un panier lisible pour les messageries", () => {
    const message = formatSocialOrderMessage({
      items: [item],
      choice: {
        fulfillment: "livraison",
        postalCode: "91260",
        deliveryAddress:
          "5 rue Jules Vallès — 91260 Juvisy-sur-Orge — Complément : 2e étage",
        label: "Aujourd'hui 19:30",
      },
      subtotal: 30,
      deliveryFee: 4,
      discount: 5,
      tip: 2,
      total: 16.8,
      promoCode: "BOULANGERIE10",
    });

    expect(message).toContain("2 x Sandwich baguette poulet");
    expect(message).toContain("Options : Pain complet");
    expect(message).toContain("Code postal : 91260");
    expect(message).toContain(
      "Adresse : 5 rue Jules Vallès — 91260 Juvisy-sur-Orge — Complément : 2e étage",
    );
    expect(message.replace(/\s/g, " ")).toContain("Total estimé : 16,80 €");
  });

  it("génère des URLs WhatsApp et Telegram encodées", () => {
    const message = "Bonjour Boulangerie\nCommande test";

    expect(buildWhatsAppOrderUrl(message)).toMatch(
      /^https:\/\/wa\.me\/33775787825\?text=/,
    );
    expect(buildWhatsAppOrderUrl(message)).toContain("Commande%20test");
    expect(buildTelegramOrderUrl(message)).toMatch(
      /^https:\/\/t\.me\/share\/url\?/,
    );
    expect(buildTelegramOrderUrl(message)).toContain("Commande%20test");
  });
});
