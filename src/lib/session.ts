import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "restaurant-session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
  const value = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && !value) {
    throw new Error("SESSION_SECRET est requis en production.");
  }
  return value ?? "dev-insecure-secret-change-me";
}

/** Signe une valeur (HMAC) pour empêcher la falsification du cookie. */
function sign(value: string) {
  const sig = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", secret())
    .update(value)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

/** Ouvre une session pour un email (auth passwordless, MVP). */
export async function createSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, sign(email.toLowerCase()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/** Retourne l'email connecté, ou null. */
export async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE)?.value;
  if (!raw) return null;
  return unsign(raw);
}

/** Ferme la session. */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}
