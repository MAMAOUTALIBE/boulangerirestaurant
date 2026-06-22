import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Retourne le restaurant actif par défaut utilisé pour les nouvelles commandes.
 * Priorité: `DEFAULT_RESTAURANT_SLUG`, sinon premier restaurant actif.
 */
export async function getDefaultRestaurant() {
  const slug = process.env.DEFAULT_RESTAURANT_SLUG?.trim().toLowerCase();
  if (slug) {
    const bySlug = await prisma.restaurant.findUnique({ where: { slug } });
    if (bySlug?.active) return bySlug;
  }
  return prisma.restaurant.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
}
