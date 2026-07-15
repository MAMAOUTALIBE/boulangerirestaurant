import { siteConfig } from "@/lib/config";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envoi d'email.
 * - Si `RESEND_API_KEY` est défini : envoi réel via l'API Resend.
 * - Sinon : log en console (mode développement), sans planter le flux.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ??
    `${siteConfig.shortName} <${siteConfig.contact.email}>`;

  if (!apiKey) {
    console.info(`[email:simulation] → ${to} | ${subject}`);
    return { simulated: true as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    console.error("[email] échec d'envoi", await res.text());
    return { simulated: false as const, ok: false };
  }
  return { simulated: false as const, ok: true };
}
