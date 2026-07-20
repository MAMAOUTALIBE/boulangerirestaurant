/**
 * Masquage de PII pour les logs — voir `redact.test.ts`.
 * Framework-free / testable. Évite d'écrire emails/téléphones en clair dans
 * les logs (mode simulation email/SMS).
 */

/** Masque un email : `jean.dupont@ex.com` → `j***@ex.com`. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const first = email[0];
  const domain = email.slice(at + 1);
  return `${first}***@${domain}`;
}

/** Masque un numéro : ne garde que les 2 derniers chiffres (`+33 6…89` → `***89`). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 2) return "***";
  return `***${digits.slice(-2)}`;
}
