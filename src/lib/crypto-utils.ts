import "server-only";
import crypto from "node:crypto";

/**
 * Comparaison de chaînes à temps constant, **sans fuite de longueur**.
 * On compare des HMAC de longueur fixe (clé aléatoire par appel) plutôt que
 * les octets bruts : `timingSafeEqual` exigerait des tampons de même taille,
 * et un court-circuit sur la longueur révélerait la taille du secret.
 */
export function timingSafeStrEqual(a: string, b: string): boolean {
  const key = crypto.randomBytes(32);
  const ha = crypto.createHmac("sha256", key).update(a).digest();
  const hb = crypto.createHmac("sha256", key).update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
