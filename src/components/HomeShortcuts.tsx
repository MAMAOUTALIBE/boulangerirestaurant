import Link from "next/link";
import {
  CalendarCheck,
  ShoppingBag,
  Croissant,
  type LucideIcon,
} from "lucide-react";

const shortcuts: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/commander", label: "Commander", Icon: ShoppingBag },
  { href: "/reservation", label: "Réserver", Icon: CalendarCheck },
  { href: "/menu", label: "Voir le menu", Icon: Croissant },
];

/**
 * Accès rapides (mobile/tablette uniquement) : actions utiles dès l'arrivée.
 */
export function HomeShortcuts() {
  return (
    <nav aria-label="Accès rapides" className="bg-[#050505] lg:hidden">
      <div className="home-shortcuts-grid grid grid-cols-3 gap-2 px-0 pb-3 pt-0">
        {shortcuts.map(({ href, label, Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={`home-quick-action flex min-h-[4.1rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#D89A1C]/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] px-1.5 py-2 text-center shadow-[0_16px_38px_-30px_rgba(245,158,11,0.9)] transition hover:border-[#D89A1C]/60 hover:bg-white/[0.06] active:scale-95 ${
              index === 0 ? "home-quick-action-primary" : ""
            }`}
          >
            <span
              className={`home-quick-icon grid h-9 w-9 place-items-center rounded-full border border-[#D89A1C]/50 bg-black/35 text-[#D89A1C] ${
                index === 0 ? "home-quick-icon-primary" : ""
              }`}
            >
              <Icon className="h-[1.125rem] w-[1.125rem]" />
            </span>
            <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] font-semibold leading-tight text-[#F8F3EA] min-[390px]:text-xs">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
