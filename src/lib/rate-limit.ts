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

/** Identifie l'appelant via l'IP (en-têtes proxy) ou un fallback. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
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
