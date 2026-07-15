import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";
import { listSiteTesters } from "@/lib/testers";
import { STAGE_LABELS } from "@/lib/site-activity";

export const dynamic = "force-dynamic";

function csv(value: string | number | boolean | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/admin/tests.csv — export « qui teste le site » (admin). */
export async function GET(request: Request) {
  if (!isAdminEmail(await getSessionEmail())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const testers = await listSiteTesters({
    q: searchParams.get("q") ?? undefined,
    stage: searchParams.get("stage") ?? undefined,
  });

  const header = [
    "nom",
    "email",
    "telephone",
    "anonyme",
    "etape",
    "canaux",
    "passages",
    "commandes",
    "commandes_en_attente",
    "commandes_payees",
    "commandes_annulees",
    "total_commande_eur",
    "dernier_statut",
    "premiere_activite",
    "derniere_activite",
  ];

  const rows = testers.map((t) =>
    [
      t.name,
      t.email,
      t.phone,
      t.anonymous ? "oui" : "non",
      STAGE_LABELS[t.stage],
      t.channels.join(" | "),
      t.visits,
      t.counts.orders,
      t.counts.ordersPending,
      t.counts.ordersPaid,
      t.counts.ordersCanceled,
      t.totalOrdered.toFixed(2),
      t.lastStatus,
      new Date(t.firstAt).toISOString(),
      new Date(t.lastAt).toISOString(),
    ]
      .map(csv)
      .join(";"),
  );

  return new NextResponse([header.join(";"), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="qui-teste-le-site-restaurant.csv"',
    },
  });
}
