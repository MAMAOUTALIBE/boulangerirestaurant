import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";
import { getAllOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** GET /api/admin/finance.csv — synthèse financière journalière (admin). */
export async function GET() {
  if (!isAdminEmail(await getSessionEmail())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const orders = (await getAllOrders()).filter((o) => o.status !== "annulée");

  // Agrégation par jour.
  const byDay = new Map<
    string,
    { commandes: number; brut: number; remises: number; net: number }
  >();
  for (const o of orders) {
    const day = o.createdAt.slice(0, 10);
    const e = byDay.get(day) ?? { commandes: 0, brut: 0, remises: 0, net: 0 };
    e.commandes += 1;
    e.brut += o.subtotal;
    e.remises += o.discount;
    e.net += o.total;
    byDay.set(day, e);
  }

  const rows = Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(
      ([day, e]) =>
        `${day};${e.commandes};${e.brut.toFixed(2)};${e.remises.toFixed(2)};${e.net.toFixed(2)}`,
    );
  const body = ["date;commandes;ca_brut;remises;ca_net", ...rows].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="finances-restaurant.csv"',
    },
  });
}
