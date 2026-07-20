import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;

/**
 * POST /api/csp-report — reçoit les rapports de violation CSP (phase Report-Only).
 * Sert à ajuster la politique avant de la passer en enforce. Non bloquant, borné,
 * ne renvoie jamais de données. Voir la CSP dans next.config.mjs.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 413 });
    }
    const data = JSON.parse(raw);
    // `csp-report` (Chrome/Firefox) ou tableau `reports` (Reporting API).
    const report = data["csp-report"] ?? data;
    const directive =
      report?.["violated-directive"] ??
      report?.effectiveDirective ??
      report?.body?.effectiveDirective ??
      "?";
    const blocked =
      report?.["blocked-uri"] ??
      report?.blockedURL ??
      report?.body?.blockedURL ??
      "?";
    console.warn(`[csp-report] ${directive} ← ${blocked}`);
  } catch {
    // Rapport illisible : on ignore silencieusement.
  }
  // 204 : accusé de réception sans contenu.
  return new NextResponse(null, { status: 204 });
}
