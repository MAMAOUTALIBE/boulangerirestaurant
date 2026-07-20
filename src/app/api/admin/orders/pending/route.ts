import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/admin/orders/pending — compteurs pour les notifications live. */
export async function GET() {
  if (!(await isAdminSession())) {
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
