"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CalendarCheck,
  CakeSlice,
  ChefHat,
  Inbox,
  UtensilsCrossed,
  Mail,
  BarChart3,
  Settings,
  MonitorPlay,
  ShoppingCart,
  Star,
  Sparkles,
  Recycle,
  Bike,
  ClipboardList,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/admin",
    label: "Tableau de bord",
    Icon: LayoutDashboard,
    exact: true,
  },
  { href: "/admin/service", label: "Service", Icon: MonitorPlay },
  { href: "/admin/commandes", label: "Commandes", Icon: ShoppingBag },
  { href: "/admin/livraisons", label: "Livraisons", Icon: Bike },
  { href: "/admin/clients", label: "Clients", Icon: Users },
  { href: "/admin/reservations", label: "Réservations", Icon: CalendarCheck },
  { href: "/admin/traiteur", label: "Traiteur", Icon: ChefHat },
  { href: "/admin/gateaux", label: "Gâteaux", Icon: CakeSlice },
  { href: "/admin/saison", label: "Saison", Icon: Sparkles },
  { href: "/admin/anti-gaspi", label: "Anti-gaspi", Icon: Recycle },
  { href: "/admin/messages", label: "Messages", Icon: Inbox },
  { href: "/admin/avis", label: "Avis", Icon: Star },
  { href: "/admin/menu", label: "Menu", Icon: UtensilsCrossed },
  { href: "/admin/marketing", label: "Marketing", Icon: Mail },
  { href: "/admin/paniers", label: "Paniers", Icon: ShoppingCart },
  { href: "/admin/rapports", label: "Rapports", Icon: BarChart3 },
  { href: "/admin/recap", label: "Récap service", Icon: ClipboardList },
  { href: "/admin/parametres", label: "Paramètres", Icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:gap-1 lg:p-4">
      {links.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
              active
                ? "bg-gold text-ink"
                : "text-cream/80 hover:bg-white/5 hover:text-cream",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
      <Link
        href="/"
        className="mt-1 flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-cream lg:mt-auto"
      >
        <Home className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">Retour au site</span>
      </Link>
    </nav>
  );
}
