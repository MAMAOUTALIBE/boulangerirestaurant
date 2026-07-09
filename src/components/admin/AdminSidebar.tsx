"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  UsersRound,
  CalendarCheck,
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
  Store,
  Megaphone,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  Icon: LucideIcon;
  items: NavLink[];
};

// Écrans du quotidien — toujours visibles.
const topLinks: NavLink[] = [
  {
    href: "/admin",
    label: "Tableau de bord",
    Icon: LayoutDashboard,
    exact: true,
  },
  { href: "/admin/service", label: "Service", Icon: MonitorPlay },
  { href: "/admin/commandes", label: "Commandes", Icon: ShoppingBag },
  { href: "/admin/reservations", label: "Réservations", Icon: CalendarCheck },
  { href: "/admin/clients", label: "Clients", Icon: Users },
  { href: "/admin/livraisons", label: "Livraisons", Icon: Bike },
  { href: "/admin/messages", label: "Messages", Icon: Inbox },
  { href: "/admin/menu", label: "Menu", Icon: UtensilsCrossed },
];

// Fonctions secondaires — repliées dans des menus déroulants.
const groups: NavGroup[] = [
  {
    id: "ventes",
    label: "Ventes spéciales",
    Icon: Store,
    items: [
      { href: "/admin/traiteur", label: "Traiteur", Icon: ChefHat },
      { href: "/admin/sur-mesure", label: "Sur-mesure", Icon: UsersRound },
      { href: "/admin/saison", label: "Saison", Icon: Sparkles },
      { href: "/admin/anti-gaspi", label: "Anti-gaspi", Icon: Recycle },
      { href: "/admin/paniers", label: "Paniers", Icon: ShoppingCart },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & rapports",
    Icon: Megaphone,
    items: [
      { href: "/admin/leads", label: "Leads tests", Icon: Users },
      { href: "/admin/avis", label: "Avis", Icon: Star },
      { href: "/admin/marketing", label: "Marketing", Icon: Mail },
      { href: "/admin/rapports", label: "Rapports", Icon: BarChart3 },
      { href: "/admin/recap", label: "Récap service", Icon: ClipboardList },
    ],
  },
];

// Toujours visibles, en bas.
const settingsLink: NavLink = {
  href: "/admin/parametres",
  label: "Paramètres",
  Icon: Settings,
};
const backLink: NavLink = { href: "/", label: "Retour au site", Icon: Home };

const STORAGE_KEY = "crm-sidebar-groups";

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (link: NavLink) =>
    link.href === "/"
      ? false
      : link.exact
        ? pathname === link.href
        : pathname.startsWith(link.href);

  const activeGroupId =
    groups.find((g) => g.items.some((it) => pathname.startsWith(it.href)))
      ?.id ?? null;

  // État initial déterministe (SSR == client) : seul le groupe actif est ouvert.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g.id === activeGroupId])),
  );

  // Restaure les préférences mémorisées, en gardant le groupe actif ouvert.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      setOpen((prev) => {
        const next = { ...prev };
        for (const g of groups)
          if (typeof saved[g.id] === "boolean") next[g.id] = saved[g.id];
        if (activeGroupId) next[activeGroupId] = true;
        return next;
      });
    } catch {
      // localStorage indisponible : on garde l'état par défaut.
    }
  }, [activeGroupId]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore : pas de persistance si localStorage indisponible.
      }
      return next;
    });

  const renderLink = (
    link: NavLink,
    opts?: { sub?: boolean; muted?: boolean },
  ) => {
    const active = isActive(link);
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
          opts?.sub && "lg:py-2 lg:text-[0.82rem]",
          active
            ? "bg-gold text-ink"
            : opts?.muted
              ? "text-muted hover:bg-white/5 hover:text-cream"
              : "text-cream/80 hover:bg-white/5 hover:text-cream",
        )}
      >
        <link.Icon className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{link.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile / tablette : barre horizontale qui défile — groupes aplatis,
          séparés par un trait, pour que tout reste accessible sans déroulant. */}
      <nav className="flex gap-1 overflow-x-auto p-3 lg:hidden">
        {topLinks.map((l) => renderLink(l))}
        {groups.map((g) => (
          <Fragment key={g.id}>
            <span
              className="mx-1 my-1 w-px shrink-0 self-stretch bg-white/10"
              aria-hidden
            />
            {g.items.map((l) => renderLink(l))}
          </Fragment>
        ))}
        <span
          className="mx-1 my-1 w-px shrink-0 self-stretch bg-white/10"
          aria-hidden
        />
        {renderLink(settingsLink)}
        {renderLink(backLink, { muted: true })}
      </nav>

      {/* Desktop : colonne verticale avec groupes déroulants. */}
      <nav className="hidden p-4 lg:flex lg:flex-1 lg:flex-col lg:gap-1">
        {topLinks.map((l) => renderLink(l))}

        {groups.map((g) => {
          const isOpen = open[g.id];
          const hasActive = g.items.some((it) => isActive(it));
          return (
            <div key={g.id}>
              <button
                type="button"
                onClick={() => toggle(g.id)}
                aria-expanded={isOpen}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                  hasActive
                    ? "text-cream"
                    : "text-cream/70 hover:bg-white/5 hover:text-cream",
                )}
              >
                <g.Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 whitespace-nowrap text-left">
                  {g.label}
                </span>
                {hasActive && !isOpen && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                    aria-hidden
                  />
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <div className="ml-[1.45rem] mt-1 space-y-1 border-l border-white/10 pl-2">
                  {g.items.map((l) => renderLink(l, { sub: true }))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-auto flex flex-col gap-1 pt-2">
          {renderLink(settingsLink)}
          {renderLink(backLink, { muted: true })}
        </div>
      </nav>
    </>
  );
}
