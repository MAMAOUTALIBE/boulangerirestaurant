import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/session";
import { getAllOrders } from "@/lib/orders";
import { csvRow } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** GET /api/admin/orders.csv — export des commandes (admin uniquement). */
export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const orders = await getAllOrders();
  const header = [
    "reference",
    "date",
    "statut",
    "client",
    "email",
    "telephone",
    "total",
    "articles",
  ];
  const rows = orders.map((o) =>
    csvRow([
      o.reference,
      o.createdAt,
      o.status,
      o.customer.name,
      o.customer.email,
      o.customer.phone,
      o.total.toFixed(2),
      o.items.map((i) => `${i.quantity}x ${i.name}`).join(" | "),
    ]),
  );
  const body = [header.join(";"), ...rows].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="commandes-restaurant.csv"',
    },
  });
}
