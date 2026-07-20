import { NextRequest, NextResponse } from "next/server";

/**
 * Garde de bord (défense en profondeur) pour /admin/* et /api/admin/*.
 * Convention Next 16 : `proxy.ts` (ex-`middleware.ts`).
 *
 * L'accès admin est déjà vérifié dans `admin/layout.tsx`, chaque route
 * `/api/admin/*` et chaque action `admin*`. Ce proxy **échoue-fermé** en amont :
 * si une future route oubliait sa vérification, une requête sans session admin
 * valide serait quand même bloquée ici. Il re-vérifie la signature HMAC du
 * cookie et le rôle (Web Crypto — parité confirmée avec `node:crypto` côté
 * `session.ts`), donc un cookie forgé/expiré/non-admin ne passe pas.
 */

const COOKIE = "restaurant-session";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function decodeBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hasAdminSession(req: NextRequest): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return false;
  const idx = raw.lastIndexOf(".");
  if (idx === -1) return false;
  const payload = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  if (!safeEqualHex(sig, await hmacHex(secret, payload))) return false;
  try {
    const data = JSON.parse(decodeBase64Url(payload)) as {
      e?: unknown;
      r?: unknown;
      exp?: unknown;
    };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return false;
    if (data.r !== "admin") return false;
    const email = typeof data.e === "string" ? data.e.toLowerCase() : "";
    return adminEmails().includes(email);
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  // Sans SESSION_SECRET (dev), la signature utilise un secret éphémère connu du
  // seul serveur : impossible à vérifier ici. On laisse alors le layout/route
  // faire foi (fail-open hors prod uniquement — le secret est requis en prod).
  if (!process.env.SESSION_SECRET) return NextResponse.next();
  if (await hasAdminSession(req)) return NextResponse.next();

  // Session admin absente/invalide : API → 403 JSON, pages → écran de connexion admin.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const url = new URL("/compte", req.url);
  url.searchParams.set("admin", "1");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
