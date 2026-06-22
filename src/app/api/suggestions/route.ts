import { NextResponse } from "next/server";
import { getMenuForBrowser } from "@/lib/dishes";

export const dynamic = "force-dynamic";

// Boissons et pâtisseries proposées en vente additionnelle dans le panier.
const SUGGEST_CATEGORIES = ["boissons", "patisseries"];

/** GET /api/suggestions — boissons & pâtisseries ajoutables en 1 clic. */
export async function GET() {
  try {
    const { categories, dishes } = await getMenuForBrowser();
    const suggestSlugs = new Set(
      categories
        .filter((c) => SUGGEST_CATEGORIES.includes(c.slug.toLowerCase()))
        .map((c) => c.id),
    );

    const suggestions = dishes
      .filter(
        (d) => d.available && !d.hasOptions && suggestSlugs.has(d.categoryId),
      )
      .slice(0, 6)
      .map((d) => ({
        dishId: d.id,
        name: d.name,
        image: d.image,
        basePrice: d.price,
      }));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
