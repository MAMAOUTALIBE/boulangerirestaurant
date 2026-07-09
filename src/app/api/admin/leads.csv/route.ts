import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";
import {
  DEMO_LEAD_SOURCES,
  demoLeadSourceLabels,
  listDemoLeads,
  type DemoLeadSource,
} from "@/lib/demo-leads";

export const dynamic = "force-dynamic";

function csv(value: string | number | boolean | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function sourceLabel(source: string): string {
  return DEMO_LEAD_SOURCES.includes(source as DemoLeadSource)
    ? demoLeadSourceLabels[source as DemoLeadSource]
    : source;
}

/** GET /api/admin/leads.csv — export des contacts de test (admin). */
export async function GET() {
  if (!isAdminEmail(await getSessionEmail())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const leads = await listDemoLeads();
  const header = [
    "nom",
    "telephone",
    "email",
    "source",
    "reference",
    "dernier_test",
    "passages",
    "commande_creee",
    "notes",
  ];
  const rows = leads.map((lead) =>
    [
      lead.name,
      lead.phone,
      lead.email,
      sourceLabel(lead.source),
      lead.sourceId,
      lead.lastSeenAt.toISOString(),
      lead.visits,
      lead.converted,
      lead.message,
    ]
      .map(csv)
      .join(";"),
  );

  return new NextResponse([header.join(";"), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="leads-tests-restaurant.csv"',
    },
  });
}
