import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { isAdminEmail } from "@/lib/auth";

const COOKIE = "restaurant-session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours (en secondes)

export type SessionRole = "customer" | "admin";

export interface Session {
  email: string;
  role: SessionRole;
}

// Hors production sans SESSION_SECRET configuré : secret aléatoire **éphémère**
// (régénéré à chaque démarrage du process) plutôt qu'une constante publique
// falsifiable. Un attaquant ne peut donc pas forger de cookie admin en staging
// avec un secret connu ; les sessions ne survivent pas à un redémarrage en dev.
const EPHEMERAL_SECRET = crypto.randomBytes(32).toString("hex");

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET est requis en production.");
    }
    return EPHEMERAL_SECRET;
  }
  return value;
}

function hmac(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

/** Signe un payload (HMAC) pour empêcher la falsification du cookie. */
function sign(payload: string): string {
  return `${payload}.${hmac(payload)}`;
}

/** Vérifie la signature et renvoie le payload, ou null. */
function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const payload = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const a = Buffer.from(sig);
  const b = Buffer.from(hmac(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return payload;
}

/**
 * Ouvre une session signée : email + rôle + date d'expiration embarquée.
 * Le rôle `admin` n'est accordé **que** par la connexion mot de passe
 * (`adminLogin`) ; le lien magique crée toujours une session `customer`,
 * même pour un email présent dans l'allowlist.
 */
export async function createSession(
  email: string,
  role: SessionRole = "customer",
) {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      e: email.toLowerCase(),
      r: role,
      iat: now,
      exp: now + MAX_AGE * 1000,
    }),
    "utf8",
  ).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/** Retourne la session courante (signature valide **et** non expirée), ou null. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE)?.value;
  if (!raw) return null;
  const payload = unsign(raw);
  if (!payload) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { e?: unknown; r?: unknown; exp?: unknown };
    if (typeof data.e !== "string") return null;
    // Expiration serveur (le maxAge cookie n'est qu'indicatif côté navigateur).
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    const role: SessionRole = data.r === "admin" ? "admin" : "customer";
    return { email: data.e, role };
  } catch {
    return null;
  }
}

/** Retourne l'email connecté (client ou admin), ou null. */
export async function getSessionEmail(): Promise<string | null> {
  return (await getSession())?.email ?? null;
}

/**
 * Vrai **uniquement** si la session porte le rôle `admin` ET que l'email est
 * dans l'allowlist. C'est le seul point de décision d'accès back-office : un
 * lien magique (rôle `customer`) sur un email allowlisté ne suffit pas — le
 * mot de passe admin redevient obligatoire.
 */
export async function isAdminSession(): Promise<boolean> {
  const session = await getSession();
  return !!session && session.role === "admin" && isAdminEmail(session.email);
}

/** Ferme la session. */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}
