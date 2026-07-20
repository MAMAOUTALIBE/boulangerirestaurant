import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { csvRow } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** GET /api/admin/subscribers.csv — export des abonnés newsletter (admin). */
export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const subs = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
  const body = [
    "email;inscrit_le",
    ...subs.map((s) => csvRow([s.email, s.createdAt.toISOString()])),
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="abonnes-restaurant.csv"',
    },
  });
}
