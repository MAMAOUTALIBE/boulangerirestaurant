import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/admin/subscribers.csv — export des abonnés newsletter (admin). */
export async function GET() {
  if (!isAdminEmail(await getSessionEmail())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const subs = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
  const body = [
    "email;inscrit_le",
    ...subs.map((s) => `${s.email};${s.createdAt.toISOString()}`),
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="abonnes-restaurant.csv"',
    },
  });
}
