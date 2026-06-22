import { prisma } from "@/lib/prisma";

/** Avis approuvés + note moyenne (site public + SEO). */
export async function getApprovedReviews() {
  const reviews = await prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const count = reviews.length;
  const average =
    count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { reviews, count, average };
}
