import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultRestaurant } from "@/lib/restaurants";

export const dynamic = "force-dynamic";

type CartWriteMode = "prisma" | "legacy-composite";
let cartWriteMode: CartWriteMode | null = null;

async function resolveCartWriteMode(): Promise<CartWriteMode> {
  if (cartWriteMode) return cartWriteMode;
  try {
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND tablename = 'AbandonedCart'
    `;
    cartWriteMode = indexes.some(
      (row) => row.indexname === "AbandonedCart_restaurantId_cartId_key",
    )
      ? "legacy-composite"
      : "prisma";
  } catch {
    cartWriteMode = "prisma";
  }
  return cartWriteMode;
}

async function upsertCartLegacyComposite(params: {
  cartId: string;
  email?: string;
  name?: string;
  phone?: string;
  items: unknown;
  itemCount: number;
  total: number;
}) {
  const restaurant = await getDefaultRestaurant();
  if (!restaurant) return;

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "AbandonedCart"
        ("id","restaurantId","cartId","email","name","phone","items","itemCount","total","status","createdAt","updatedAt")
      VALUES
        ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,'actif',NOW(),NOW())
      ON CONFLICT ("restaurantId","cartId")
      DO UPDATE SET
        "items" = EXCLUDED."items",
        "itemCount" = EXCLUDED."itemCount",
        "total" = EXCLUDED."total",
        "email" = COALESCE(EXCLUDED."email","AbandonedCart"."email"),
        "name" = COALESCE(EXCLUDED."name","AbandonedCart"."name"),
        "phone" = COALESCE(EXCLUDED."phone","AbandonedCart"."phone"),
        "updatedAt" = NOW()
    `,
    crypto.randomUUID(),
    restaurant.id,
    params.cartId,
    params.email ?? null,
    params.name ?? null,
    params.phone ?? null,
    JSON.stringify(params.items),
    params.itemCount,
    params.total,
  );
}

/**
 * POST /api/cart — enregistre/actualise un panier côté serveur (funnel + relance).
 * Appelé (fire-and-forget) par le panier client et au checkout.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.cartId || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const items = body.items as { quantity: number; unitPrice: number }[];
  const itemCount = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
  const total = items.reduce(
    (s, i) => s + (i.unitPrice ?? 0) * (i.quantity ?? 0),
    0,
  );

  // Panier vidé → on retire le suivi (sauf s'il a déjà converti).
  if (itemCount === 0) {
    await prisma.abandonedCart
      .deleteMany({ where: { cartId: body.cartId, status: "actif" } })
      .catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const cartId = String(body.cartId);
  const email = body.email ? String(body.email).toLowerCase() : undefined;
  const name = body.name ? String(body.name) : undefined;
  const phone = body.phone ? String(body.phone) : undefined;

  try {
    const mode = await resolveCartWriteMode();
    if (mode === "legacy-composite") {
      await upsertCartLegacyComposite({
        cartId,
        email,
        name,
        phone,
        items: body.items,
        itemCount,
        total,
      });
    } else {
      await prisma.abandonedCart.upsert({
        where: { cartId },
        update: {
          items: body.items,
          itemCount,
          total,
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
          ...(phone ? { phone } : {}),
        },
        create: {
          cartId,
          items: body.items,
          itemCount,
          total,
          email,
          name,
          phone,
        },
      });
    }
  } catch (error) {
    // Tracking panier non bloquant: on n'empêche pas l'utilisateur de naviguer/commander.
    console.error("Cart tracking write failed:", error);
  }

  return NextResponse.json({ ok: true });
}
