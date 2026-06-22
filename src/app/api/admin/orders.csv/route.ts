import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";
import { getAllOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Échappe une valeur pour le format CSV. */
function csv(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/admin/orders.csv — export des commandes (admin uniquement). */
export async function GET() {
  const email = await getSessionEmail();
  if (!isAdminEmail(email)) {
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
    [
      o.reference,
      o.createdAt,
      o.status,
      o.customer.name,
      o.customer.email,
      o.customer.phone,
      o.total.toFixed(2),
      o.items.map((i) => `${i.quantity}x ${i.name}`).join(" | "),
    ]
      .map(csv)
      .join(";"),
  );
  const body = [header.join(";"), ...rows].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="commandes-restaurant.csv"',
    },
  });
}
