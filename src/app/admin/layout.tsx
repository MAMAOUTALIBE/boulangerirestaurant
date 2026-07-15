import { redirect } from "next/navigation";
import { ShieldCheck, LogOut } from "lucide-react";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";
import { logout } from "@/app/actions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { OrderNotifier } from "@/components/admin/OrderNotifier";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Garde d'accès centralisée pour toutes les routes /admin/*.
  const email = await getSessionEmail();
  if (!email || !isAdminEmail(email)) redirect("/compte?admin=1");

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-ink lg:flex-row print:h-auto print:min-h-screen print:overflow-visible">
      {/* Sidebar */}
      <aside className="shrink-0 border-b border-white/10 bg-ink-soft lg:flex lg:h-full lg:w-64 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r print:hidden">
        <div className="flex items-center gap-2 px-5 pb-1 pt-5">
          <ShieldCheck className="h-6 w-6 text-gold" />
          <span className="font-display text-lg font-bold text-cream">
            CRM {siteConfig.shortName}
          </span>
        </div>
        <AdminSidebar />
      </aside>

      {/* Contenu */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 print:hidden">
          <CommandPalette />
          <div className="flex items-center gap-3">
            <OrderNotifier />
            <p className="hidden truncate text-sm text-muted sm:block">
              <span className="text-cream">{email}</span>
            </p>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-cream transition hover:border-gold/60 hover:text-gold"
              >
                <LogOut className="h-3.5 w-3.5" />
                Déconnexion
              </button>
            </form>
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
