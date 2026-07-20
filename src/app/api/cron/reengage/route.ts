import { NextResponse } from "next/server";
import { runMarketingAutomations } from "@/lib/marketing-automation";
import { timingSafeStrEqual } from "@/lib/crypto-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reengage — exécute toutes les relances marketing actives.
 * Protégé par `CRON_SECRET` via le header `Authorization: Bearer …` uniquement
 * (le secret n'est plus accepté en query-string : il fuirait dans les logs
 * de proxy/CDN et le Referer). Vercel Cron envoie déjà ce header.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Sécurité : on refuse tant que le secret n'est pas configuré (jamais ouvert par défaut).
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  const provided = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  // Comparaison à temps constant (pas d'oracle de timing sur le secret).
  if (!provided || !timingSafeStrEqual(provided, secret)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results = await runMarketingAutomations();
  return NextResponse.json({
    rules: results.length,
    sent: results.reduce((sum, result) => sum + result.sent, 0),
    results,
  });
}
