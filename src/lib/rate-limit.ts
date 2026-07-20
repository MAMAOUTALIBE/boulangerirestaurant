import "server-only";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface Bucket {
  count: number;
  resetAt: number;
}

// Fenêtre glissante en mémoire (par instance).
// Fallback local/dev. En production, configurer UPSTASH_REDIS_REST_*.
const buckets = new Map<string, Bucket>();
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// En production multi-instances (ex. serverless), le fallback mémoire est par
// instance → limite contournable. On avertit une fois. (Sur un VPS mono-instance
// — la cible de prod — le fallback mémoire reste acceptable.)
if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_* absent : rate-limit en mémoire " +
      "(par instance). À configurer si l'app tourne en multi-instances.",
  );
}

const upstashLimiters = new Map<string, Ratelimit>();

function limiterFor(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${limit}:${windowMs}`;
  const existing = upstashLimiters.get(key);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: "restaurant:rate-limit",
    analytics: true,
  });
  upstashLimiters.set(key, limiter);
  return limiter;
}

/**
 * Nombre de proxies de confiance en frontal (Nginx = 1 par défaut).
 * Surchargeable via `TRUSTED_PROXY_COUNT` (ex. 2 si un CDN précède Nginx).
 */
function trustedProxyCount(): number {
  const raw = Number(process.env.TRUSTED_PROXY_COUNT);
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

/**
 * Identifie l'appelant par son IP réelle.
 *
 * `X-Forwarded-For` est une liste `client, proxy1, …` où seule l'entrée ajoutée
 * par NOTRE proxy de confiance est fiable — les entrées de gauche sont fournies
 * (donc falsifiables) par le client. On prend donc la n-ième entrée en partant
 * de la DROITE (n = nombre de proxies de confiance), pas la première à gauche :
 * sinon un attaquant fait varier l'en-tête et obtient un bucket neuf à chaque
 * requête, contournant tout le rate-limiting (brute-force admin, spam…).
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      const n = trustedProxyCount();
      const idx = Math.min(Math.max(parts.length - n, 0), parts.length - 1);
      return parts[idx];
    }
  }
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Autorise au plus `limit` actions par `windowMs` pour une clé donnée.
 * Retourne `true` si l'action est permise, `false` si la limite est atteinte.
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): Promise<boolean> {
  const limiter = limiterFor(limit, windowMs);
  if (limiter) {
    return limiter.limit(key).then((result) => result.success);
  }

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return Promise.resolve(true);
  }
  if (bucket.count >= limit) return Promise.resolve(false);
  bucket.count += 1;
  return Promise.resolve(true);
}
