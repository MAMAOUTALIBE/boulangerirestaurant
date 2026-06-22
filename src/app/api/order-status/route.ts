import { NextResponse } from "next/server";
import { getOrderByReference } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** GET /api/order-status?reference=NK-… — statut public d'une commande (suivi). */
export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "reference requise" }, { status: 400 });
  }
  const order = await getOrderByReference(reference);
  if (!order)
    return NextResponse.json({ error: "introuvable" }, { status: 404 });
  return NextResponse.json({ status: order.status });
}
