import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultRestaurant } from "@/lib/restaurants";
import { cartTrackingSchema } from "@/lib/validation";
import { recordDemoLead } from "@/lib/demo-leads";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Cap la taille du corps : chaque écriture crée/actualise une ligne DB + un lead.
const MAX_BODY_BYTES = 32 * 1024;

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
  // Anti-abus : borne le débit (spam de paniers/leads, gonflement DB). Généreux
  // car le panier se synchronise à chaque modification (debounced côté client).
  if (!(await rateLimit(`cart:${await clientIp()}`, 30, 60_000))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  // Cap de taille avant parsing.
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Corps trop volumineux" }, { status: 413 });
  }
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = null;
  }

  const parsed = cartTrackingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const body = parsed.data;

  const items = body.items;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  // Valeur JSON simple pour la colonne `items` (compatible Prisma).
  const itemsJson = JSON.parse(JSON.stringify(items));

  const cartId = body.cartId;

  // Panier vidé → on retire le suivi (sauf s'il a déjà converti).
  if (itemCount === 0) {
    await prisma.abandonedCart
      .deleteMany({ where: { cartId, status: "actif" } })
      .catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const email = body.email ? body.email.toLowerCase() : undefined;
  const name = body.name ? body.name : undefined;
  const phone = body.phone ? body.phone : undefined;

  try {
    const mode = await resolveCartWriteMode();
    if (mode === "legacy-composite") {
      await upsertCartLegacyComposite({
        cartId,
        email,
        name,
        phone,
        items: itemsJson,
        itemCount,
        total,
      });
    } else {
      await prisma.abandonedCart.upsert({
        where: { cartId },
        update: {
          items: itemsJson,
          itemCount,
          total,
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
          ...(phone ? { phone } : {}),
        },
        create: {
          cartId,
          items: itemsJson,
          itemCount,
          total,
          email,
          name,
          phone,
        },
      });
    }
    await recordDemoLead({
      source: "panier",
      sourceId: cartId,
      name,
      email,
      phone,
      message: `${itemCount} article(s) · ${total.toFixed(2)} €`,
    });
  } catch (error) {
    // Tracking panier non bloquant: on n'empêche pas l'utilisateur de naviguer/commander.
    console.error("Cart tracking write failed:", error);
  }

  return NextResponse.json({ ok: true });
}
