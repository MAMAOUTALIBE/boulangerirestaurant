import { NextResponse } from "next/server";
import { orderSchema } from "@/lib/validation";
import {
  createOrder,
  getOrderByReference,
  OrderCreationError,
} from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";

const MAX_BODY_BYTES = 64 * 1024;

/** POST /api/orders — crée une commande (validation Zod). */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Requête trop volumineuse" },
      { status: 413 },
    );
  }
  if (!(await rateLimit(`api-order:${await clientIp()}`, 5, 10 * 60_000))) {
    return NextResponse.json(
      { error: "Trop de commandes. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }
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
  const email = await getSessionEmail();
  const ownsOrder = email?.toLowerCase() === order.customer.email.toLowerCase();
  if (!ownsOrder && !isAdminEmail(email)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return NextResponse.json({ order });
}
