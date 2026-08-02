import { describe, expect, it } from "vitest";
import { defaultSiteConfig } from "@/lib/config";
import {
  buildTelegramOrderUrl,
  buildWhatsAppOrderUrl,
  formatSocialOrderMessage,
} from "@/lib/social-order";
import type { CartItem } from "@/types";

const item: CartItem = {
  lineId: "kebab-1",
  dishId: "kebab-grille",
  name: "Kebab grillé",
  image: "/images/hero-slide-grillades-turques.png",
  basePrice: 6.9,
  unitPrice: 7.9,
  quantity: 2,
  options: [
    {
      groupId: "accompagnement",
      optionId: "riz-pilaf",
      label: "Riz pilaf",
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
      promoCode: "BIENVENUE10",
    });

    expect(message).toContain("2 x Kebab grillé");
    expect(message).toContain("Options : Riz pilaf");
    expect(message).toContain("Code postal : 91260");
    expect(message).toContain(
      "Adresse : 5 rue Jules Vallès — 91260 Juvisy-sur-Orge — Complément : 2e étage",
    );
    expect(message.replace(/\s/g, " ")).toContain("Total estimé : 16,80 €");
  });

  it("génère des URLs WhatsApp et Telegram encodées", () => {
    const message = "Bonjour Restaurant\nCommande test";

    // Le numéro est propre à l'exploitant : on le dérive de la configuration
    // plutôt que de le figer, sinon un changement de coordonnées casse le test.
    const digits = defaultSiteConfig.messaging.whatsappOrderNumber.replace(
      /\D/g,
      "",
    );
    expect(buildWhatsAppOrderUrl(message)).toMatch(
      new RegExp(`^https://wa\\.me/${digits}\\?text=`),
    );
    expect(buildWhatsAppOrderUrl(message)).toContain("Commande%20test");
    expect(buildTelegramOrderUrl(message)).toMatch(
      /^https:\/\/t\.me\/share\/url\?/,
    );
    expect(buildTelegramOrderUrl(message)).toContain("Commande%20test");
  });
});
