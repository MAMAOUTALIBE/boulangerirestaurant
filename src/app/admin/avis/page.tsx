import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { adminApproveReview, adminDeleteReview } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminAvisPage() {
  const reviews = await prisma.review.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-cream">
        Avis clients
      </h1>
      <p className="text-sm text-muted">
        {reviews.length} avis · {pending} en attente de validation
      </p>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucun avis.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className={`rounded-2xl border p-5 ${
                r.approved
                  ? "border-white/10 bg-ink-soft/60"
                  : "border-gold/30 bg-ink-soft"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cream">{r.name}</span>
                  <span className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-gold text-gold" : "text-white/20"}`}
                      />
                    ))}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${r.approved ? "bg-green-500/15 text-green-300" : "bg-gold/15 text-gold"}`}
                >
                  {r.approved ? "publié" : "en attente"}
                </span>
              </div>
              <p className="mt-2 text-sm text-cream/85">« {r.comment} »</p>
              <div className="mt-3 flex items-center gap-2">
                {!r.approved && (
                  <form action={adminApproveReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gold-400">
                      Approuver
                    </button>
                  </form>
                )}
                <form action={adminDeleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs text-red-400 hover:text-red-300">
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
