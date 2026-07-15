import { NextResponse } from "next/server";
import { runMarketingAutomations } from "@/lib/marketing-automation";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reengage — exécute toutes les relances marketing actives.
 * Protégé par `CRON_SECRET` (header Authorization: Bearer … ou ?secret=).
 * À planifier via Vercel Cron (voir vercel.json).
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
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    url.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results = await runMarketingAutomations();
  return NextResponse.json({
    rules: results.length,
    sent: results.reduce((sum, result) => sum + result.sent, 0),
    results,
  });
}
