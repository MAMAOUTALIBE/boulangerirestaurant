import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LogOut, Package, ShieldCheck, Star } from "lucide-react";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";
import { getOrdersByEmail } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { logout, redeemLoyalty } from "@/app/actions";
import { AdminLoginForm, LoginForm } from "@/components/LoginForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReorderButton } from "@/components/ReorderButton";
import { formatPrice } from "@/lib/utils";
import {
  tierForPoints,
  tierStyles,
  POINTS_PER_REDEMPTION,
  REDEMPTION_VALUE_EUR,
} from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  payée: "bg-green-500/15 text-green-300",
  "en attente": "bg-gold/15 text-gold",
  annulée: "bg-red-500/15 text-red-300",
};

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; fid?: string; admin?: string }>;
}) {
  const { error, fid, admin: adminParam } = await searchParams;
  const email = await getSessionEmail();
  const showAdminLogin = adminParam === "1";

  if (!email) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-ink pb-64 pt-28 sm:pb-20">
          <div className="container-page max-w-md sm:max-w-4xl">
            <BackLink />

            <div className="sm:hidden">
              <h1 className="mt-6 font-display text-3xl font-bold text-cream">
                Espace client
              </h1>
              <p className="mt-2 text-muted">
                Saisissez votre email : vous recevrez un lien de connexion
                sécurisé.
              </p>
              <LoginForm initialError={Boolean(error)} />
              {showAdminLogin && <AdminLoginForm />}
            </div>

            <div className="mt-6 hidden overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(216,154,28,0.12),transparent_38%),#111111] shadow-[0_28px_85px_-62px_rgba(0,0,0,0.95)] sm:grid sm:grid-cols-[0.92fr_1.08fr]">
              <section className="p-6 lg:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
                  Connexion sécurisée
                </p>
                <h1 className="mt-2 font-display text-4xl font-bold text-cream">
                  Espace client
                </h1>
                <p className="mt-3 text-muted">
                  Retrouvez vos commandes, vos points fidélité et vos
                  informations sans créer de mot de passe.
                </p>
                <LoginForm initialError={Boolean(error)} />
                {showAdminLogin && <AdminLoginForm />}
              </section>

              <aside className="relative min-h-[28rem] border-l border-white/10">
                <Image
                  src="/images/boulangerie-viennoiseries.webp"
                  alt="Viennoiseries et commandes de la boulangerie"
                  fill
                  sizes="42vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 grid gap-3">
                  {[
                    "Lien magique envoyé par email",
                    "Historique de commandes",
                    "Programme fidélité intégré",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/55 p-3 text-sm font-semibold text-cream backdrop-blur"
                    >
                      <ShieldCheck className="h-4 w-4 text-gold" />
                      {item}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const [orders, customer] = await Promise.all([
    getOrdersByEmail(email),
    prisma.customer.findUnique({ where: { email } }),
  ]);
  const admin = isAdminEmail(email);
  const points = customer?.loyaltyPoints ?? 0;
  const tier = tierForPoints(points);
  const canRedeem = points >= POINTS_PER_REDEMPTION;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-ink pb-64 pt-28 sm:pb-20">
        <div className="container-page max-w-2xl">
          <BackLink />
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold text-cream">
                Mes commandes
              </h1>
              <p className="break-all text-sm text-muted">{email}</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              {admin && (
                <Link
                  href="/admin"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10 sm:flex-none"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Back-office
                </Link>
              )}
              <form action={logout} className="flex-1 sm:flex-none">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-cream transition hover:border-gold/60 hover:text-gold"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </form>
            </div>
          </div>

          {/* Carte fidélité */}
          <div className="mt-8 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/20 text-gold">
                  <Star className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm text-muted">Vos points fidélité</p>
                  <p className="font-display text-2xl font-bold text-cream">
                    {points} pts
                    <span
                      className={`ml-2 rounded-full px-2.5 py-0.5 align-middle text-xs font-semibold ${tierStyles[tier]}`}
                    >
                      {tier}
                    </span>
                  </p>
                </div>
              </div>
              <form action={redeemLoyalty} className="w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={!canRedeem}
                  className="btn-primary w-full justify-center disabled:opacity-50 sm:w-auto"
                >
                  Convertir {POINTS_PER_REDEMPTION} pts → {REDEMPTION_VALUE_EUR}{" "}
                  €
                </button>
              </form>
            </div>
            {fid === "insuffisant" && (
              <p className="mt-3 text-sm text-red-400">
                Pas assez de points (minimum {POINTS_PER_REDEMPTION}).
              </p>
            )}
            {fid && fid !== "insuffisant" && (
              <p className="mt-3 text-sm text-green-400">
                🎉 Code généré :{" "}
                <span className="font-mono font-bold">{fid}</span> (
                {REDEMPTION_VALUE_EUR} € de remise). Utilisez-le à votre
                prochaine commande !
              </p>
            )}
            <p className="mt-2 text-xs text-muted">
              Vous gagnez 1 point par euro payé.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-ink-soft p-12 text-center">
              <Package className="h-12 w-12 text-muted" />
              <p className="text-muted">Aucune commande pour cet email.</p>
              <Link href="/menu" className="btn-primary">
                Découvrir le menu
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-ink-soft p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/commande/${order.reference}`}
                      className="font-mono text-gold hover:underline"
                    >
                      {order.reference}
                    </Link>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[order.status] ?? "bg-white/10 text-cream"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · {order.items.reduce((n, i) => n + i.quantity, 0)}{" "}
                    article(s)
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-display text-lg font-bold text-cream">
                      {formatPrice(order.total)}
                    </p>
                    <ReorderButton reference={order.reference} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour à l&apos;accueil
    </Link>
  );
}
