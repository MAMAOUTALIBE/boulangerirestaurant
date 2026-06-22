import { NextResponse } from "next/server";
import { orderSchema } from "@/lib/validation";
import {
  createOrder,
  getOrderByReference,
  OrderCreationError,
} from "@/lib/orders";

/** POST /api/orders — crée une commande (validation Zod). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const {
    name,
    email,
    phone,
    address,
    notes,
    promoCode,
    fulfillment,
    postalCode,
    tip,
    scheduledAt,
    items,
  } = parsed.data;
  let order;
  try {
    order = await createOrder({
      customer: { name, email, phone, address, notes },
      items,
      promoCode,
      fulfillment,
      postalCode,
      tip,
      scheduledAt,
    });
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
  const { notifyOrderChannels } = await import("@/lib/order-notifications");
  await notifyOrderChannels(order);
  return NextResponse.json({ order }, { status: 201 });
}

/** GET /api/orders?reference=NK-XXX — récupère une commande. */
export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json(
      { error: "Paramètre 'reference' requis" },
      { status: 400 },
    );
  }
  const order = await getOrderByReference(reference);
  if (!order) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
