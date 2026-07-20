import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Result {
  type: "Commande" | "Client" | "Plat";
  label: string;
  sub: string;
  href: string;
}

/** GET /api/admin/search?q= — recherche globale (commandes, clients, plats). */
export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const like = { contains: q, mode: "insensitive" as const };

  const [orders, customers, dishes] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { reference: like },
          { customerName: like },
          { customerEmail: like },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { OR: [{ name: like }, { email: like }] },
      take: 5,
    }),
    prisma.dish.findMany({ where: { name: like }, take: 5 }),
  ]);

  const results: Result[] = [
    ...orders.map((o) => ({
      type: "Commande" as const,
      label: o.reference,
      sub: `${o.customerName} · ${o.status}`,
      href: `/admin/commandes/${o.reference}`,
    })),
    ...customers.map((c) => ({
      type: "Client" as const,
      label: c.name ?? c.email,
      sub: c.email,
      href: `/admin/clients/${encodeURIComponent(c.email)}`,
    })),
    ...dishes.map((d) => ({
      type: "Plat" as const,
      label: d.name,
      sub: `${d.price} €`,
      href: `/admin/menu`,
    })),
  ];

  return NextResponse.json({ results });
}
