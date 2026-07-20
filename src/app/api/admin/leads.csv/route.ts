import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/session";
import {
  DEMO_LEAD_SOURCES,
  demoLeadSourceLabels,
  listDemoLeads,
  type DemoLeadSource,
} from "@/lib/demo-leads";
import { csvRow } from "@/lib/csv";

export const dynamic = "force-dynamic";

function sourceLabel(source: string): string {
  return DEMO_LEAD_SOURCES.includes(source as DemoLeadSource)
    ? demoLeadSourceLabels[source as DemoLeadSource]
    : source;
}

/** GET /api/admin/leads.csv — export des contacts de test (admin). */
export async function GET() {
  if (!(await isAdminSession())) {
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
    csvRow([
      lead.name,
      lead.phone,
      lead.email,
      sourceLabel(lead.source),
      lead.sourceId,
      lead.lastSeenAt.toISOString(),
      lead.visits,
      lead.converted,
      lead.message,
    ]),
  );

  return new NextResponse([header.join(";"), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="leads-tests-restaurant.csv"',
    },
  });
}
