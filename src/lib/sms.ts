import "server-only";

interface SmsInput {
  to: string;
  body: string;
  /** true → envoi via WhatsApp (préfixe whatsapp:), sinon SMS classique. */
  whatsapp?: boolean;
}

/**
 * Envoi SMS / WhatsApp via Twilio.
 * - Si les variables TWILIO_* sont définies : envoi réel.
 * - Sinon : log en console (mode simulation), sans bloquer le flux.
 */
export async function sendSms({ to, body, whatsapp }: SmsInput) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = whatsapp
    ? process.env.TWILIO_WHATSAPP_FROM
    : process.env.TWILIO_SMS_FROM;

  if (!sid || !token || !from) {
    console.info(
      `[sms:simulation${whatsapp ? ":whatsapp" : ""}] → ${to} | ${body}`,
    );
    return { simulated: true as const };
  }

  const params = new URLSearchParams({
    To: whatsapp ? `whatsapp:${to}` : to,
    From: from,
    Body: body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  if (!res.ok) {
    console.error("[sms] échec d'envoi", await res.text());
    return { simulated: false as const, ok: false };
  }
  return { simulated: false as const, ok: true };
}
