import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site-settings";
import { sendEmail } from "@/lib/email";
import { timingSafeStrEqual } from "@/lib/crypto-utils";

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

/**
 * Vérifie le mot de passe admin.
 * - Préféré : `ADMIN_PASSWORD_HASH` au format `scrypt$<selHex>$<hashHex>`
 *   (le mot de passe en clair ne vit alors pas dans l'environnement).
 *   Générer avec : `node -e "const c=require('crypto');const s=c.randomBytes(16);
 *   process.stdout.write('scrypt$'+s.toString('hex')+'$'+c.scryptSync(process.argv[1],s,32).toString('hex'))" "MON_MOT_DE_PASSE"`
 * - Sinon : repli sur `ADMIN_PASSWORD` en clair, comparé à temps constant et
 *   sans fuite de longueur.
 */
export function isValidAdminPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return verifyScryptHash(password, hash);

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeStrEqual(password, expected);
}

function verifyScryptHash(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    if (salt.length === 0 || expected.length === 0) return false;
    const derived = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
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

  const siteConfig = await getSiteConfig();
  const url = `${siteConfig.url}/compte/verify?token=${token}`;

  const result = await sendEmail({
    to: normalized,
    subject: `Votre lien de connexion ${siteConfig.shortName}`,
    html: `<h1>Connexion à votre espace client</h1>
      <p>Cliquez sur le lien ci-dessous pour vous connecter (valable ${TOKEN_TTL_MIN} minutes) :</p>
      <p><a href="${url}">Se connecter</a></p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  });

  if (result.simulated && process.env.NODE_ENV !== "production") {
    // Hors prod uniquement : sans Resend, on logge le lien pour tester en local.
    // En prod on ne logge JAMAIS le token (sinon fuite de connexion via les logs).
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
