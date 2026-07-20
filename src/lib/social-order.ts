import type { CartItem, Fulfillment } from "@/types";
import { defaultSiteConfig } from "@/lib/config";
import { formatPrice } from "@/lib/utils";

interface SocialOrderChoice {
  fulfillment: Fulfillment;
  postalCode?: string;
  deliveryAddress?: string;
  label: string;
}

interface SocialOrderInput {
  items: CartItem[];
  choice: SocialOrderChoice;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  tip?: number;
  total: number;
  promoCode?: string;
  /** Nom du restaurant (défaut = template). Passer la valeur dynamique côté client. */
  restaurantName?: string;
}

function cleanPhone(phone: string) {
  const trimmed = phone.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `${prefix}${trimmed.replace(/\D/g, "")}`;
}

function fulfillmentLabel(value: Fulfillment) {
  if (value === "livraison") return "Livraison";
  if (value === "surplace") return "Sur place";
  return "À emporter";
}

export function formatSocialOrderMessage({
  items,
  choice,
  subtotal,
  deliveryFee,
  discount = 0,
  tip = 0,
  total,
  promoCode,
  restaurantName = defaultSiteConfig.name,
}: SocialOrderInput) {
  const lines = [
    `Bonjour ${restaurantName}, je souhaite commander :`,
    "",
    ...items.flatMap((item) => {
      const details = [
        `- ${item.quantity} x ${item.name} (${formatPrice(item.unitPrice)} / unité)`,
      ];
      if (item.options.length > 0) {
        details.push(
          `  Options : ${item.options.map((o) => o.label).join(", ")}`,
        );
      }
      if (item.note) details.push(`  Note : ${item.note}`);
      return details;
    }),
    "",
    `Mode : ${fulfillmentLabel(choice.fulfillment)}`,
    `Créneau : ${choice.label}`,
  ];

  if (choice.postalCode) lines.push(`Code postal : ${choice.postalCode}`);
  if (choice.deliveryAddress) lines.push(`Adresse : ${choice.deliveryAddress}`);
  lines.push(`Sous-total : ${formatPrice(subtotal)}`);
  if (discount > 0) {
    lines.push(
      `Remise${promoCode ? ` (${promoCode})` : ""} : -${formatPrice(discount)}`,
    );
  }
  if (deliveryFee > 0) lines.push(`Livraison : ${formatPrice(deliveryFee)}`);
  if (tip > 0) lines.push(`Pourboire : ${formatPrice(tip)}`);
  lines.push(`Total estimé : ${formatPrice(total)}`);
  lines.push("");
  lines.push("Je vous confirme mes coordonnées dans ce chat.");

  return lines.join("\n");
}

export function buildWhatsAppOrderUrl(
  message: string,
  whatsappNumber: string = defaultSiteConfig.messaging.whatsappOrderNumber,
) {
  const phone = cleanPhone(whatsappNumber).replace(/^\+/, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildTelegramOrderUrl(
  message: string,
  telegramUsername: string = defaultSiteConfig.messaging.telegramOrderUsername,
  siteUrl: string = defaultSiteConfig.url,
) {
  const username = telegramUsername.replace(/^@/, "");
  const url = `${siteUrl}/commander`;
  const text = username ? `${message}\n\nÀ envoyer à @${username}.` : message;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
