import "server-only";

import type { Order } from "@/types";
import { siteConfig } from "@/lib/config";
import { sendSms } from "@/lib/sms";
import { formatPrice } from "@/lib/utils";

function normalizeE164(phone: string) {
  const trimmed = phone.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `${prefix}${trimmed.replace(/\D/g, "")}`;
}

function channelMessage(order: Order) {
  const lines = [
    `Nouvelle commande ${order.reference}`,
    `${order.customer.name} - ${order.customer.phone}`,
    `${order.customer.email}`,
    "",
    `Mode : ${order.fulfillment}`,
    order.scheduledAt
      ? `Créneau : ${new Date(order.scheduledAt).toLocaleString("fr-FR")}`
      : null,
    order.customer.address ? `Adresse : ${order.customer.address}` : null,
    "",
    ...order.items.map(
      (item) =>
        `${item.quantity} x ${item.name} - ${formatPrice(item.price * item.quantity)}`,
    ),
    "",
    `Total : ${formatPrice(order.total)}`,
    order.customer.notes ? `Notes : ${order.customer.notes}` : null,
    `${siteConfig.url}/admin/commandes/${order.reference}`,
  ].filter(Boolean);

  return lines.join("\n");
}

async function notifyWhatsApp(order: Order, text: string) {
  const to =
    process.env.WHATSAPP_ORDER_TO ??
    process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER ??
    siteConfig.messaging.whatsappOrderNumber;

  return sendSms({
    to: normalizeE164(to),
    body: text,
    whatsapp: true,
  });
}

async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ORDER_CHAT_ID;

  if (!token || !chatId) {
    console.info(`[telegram:simulation] ${text.split("\n")[0]}`);
    return { simulated: true as const };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        disable_web_page_preview: true,
      }),
    },
  );

  if (!response.ok) {
    console.error("[telegram] échec d'envoi", await response.text());
    return { simulated: false as const, ok: false };
  }

  return { simulated: false as const, ok: true };
}

export async function notifyOrderChannels(order: Order) {
  const text = channelMessage(order);
  const results = await Promise.allSettled([
    notifyWhatsApp(order, text),
    notifyTelegram(text),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[order-notifications] échec canal", result.reason);
    }
  }
}
