import { prisma } from "@/lib/prisma";
import { adminToggleContactHandled } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  const pending = messages.filter((m) => !m.handled).length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-cream">Messages</h1>
      <p className="text-sm text-muted">
        {messages.length} message(s) · {pending} à traiter
      </p>

      {messages.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-muted">
          Aucun message.
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-2xl border p-5 ${
                m.handled
                  ? "border-white/10 bg-ink-soft/50 opacity-70"
                  : "border-gold/30 bg-ink-soft"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-cream">{m.name}</span>
                <a
                  href={`mailto:${m.email}`}
                  className="text-sm text-gold hover:underline"
                >
                  {m.email}
                </a>
                {m.phone && (
                  <a
                    href={`tel:${m.phone.replace(/\s/g, "")}`}
                    className="text-sm text-gold hover:underline"
                  >
                    {m.phone}
                  </a>
                )}
                <span className="text-xs text-muted">
                  {new Date(m.createdAt).toLocaleString("fr-FR")}
                </span>
              </div>
              <p className="mt-2 text-sm text-cream/85">{m.message}</p>
              <form action={adminToggleContactHandled} className="mt-3">
                <input type="hidden" name="id" value={m.id} />
                <input
                  type="hidden"
                  name="handled"
                  value={(!m.handled).toString()}
                />
                <button
                  type="submit"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    m.handled
                      ? "border border-white/15 text-cream hover:border-white/40"
                      : "bg-gold text-ink hover:bg-gold-400"
                  }`}
                >
                  {m.handled ? "Rouvrir" : "Marquer comme traité"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
