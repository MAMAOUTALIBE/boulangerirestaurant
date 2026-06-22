import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/admin/orders/pending — compteurs pour les notifications live. */
export async function GET() {
  if (!isAdminEmail(await getSessionEmail())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const [pending, latest] = await Promise.all([
    prisma.order.count({ where: { status: "en attente" } }),
    prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { reference: true, createdAt: true },
    }),
  ]);
  return NextResponse.json({
    pending,
    latestReference: latest?.reference ?? null,
    latestAt: latest?.createdAt?.toISOString() ?? null,
  });
}
