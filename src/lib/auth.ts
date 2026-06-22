import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";
import { sendEmail } from "@/lib/email";

const TOKEN_TTL_MIN = 15;

/** Emails autorisés à accéder au back-office (séparés par des virgules). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export function isValidAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const passwordBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  if (passwordBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(passwordBuffer, expectedBuffer);
}

/**
 * Crée un lien magique pour `email` et l'envoie par mail.
 * Retourne l'URL (utile en mode simulation/dev pour la logguer).
 */
export async function createMagicLink(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);

  // Un seul lien actif par email à la fois.
  await prisma.verificationToken.deleteMany({ where: { email: normalized } });
  await prisma.verificationToken.create({
    data: { token, email: normalized, expiresAt },
  });

  const url = `${siteConfig.url}/compte/verify?token=${token}`;

  const result = await sendEmail({
    to: normalized,
    subject: `Votre lien de connexion ${siteConfig.shortName}`,
    html: `<h1>Connexion à votre espace client</h1>
      <p>Cliquez sur le lien ci-dessous pour vous connecter (valable ${TOKEN_TTL_MIN} minutes) :</p>
      <p><a href="${url}">Se connecter</a></p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  });

  if (result.simulated) {
    // En l'absence de Resend, on logge le lien pour pouvoir tester en local.
    console.info(`[auth:magic-link] ${normalized} → ${url}`);
  }

  return url;
}

/**
 * Valide un jeton : retourne l'email si valide (et consomme le jeton),
 * sinon `null`.
 */
export async function consumeMagicToken(token: string): Promise<string | null> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row) return null;

  // Jeton à usage unique : on le supprime quoi qu'il arrive.
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.email;
}
