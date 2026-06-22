import Link from "next/link";
import {
  ShoppingBag,
  Croissant,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { phoneHref } from "@/lib/contactLinks";

const shortcuts: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/commander", label: "Commander", Icon: ShoppingBag },
  { href: "/menu", label: "Carte", Icon: Croissant },
  { href: phoneHref, label: "Appeler", Icon: Phone },
];

/**
 * Accès rapides (mobile/tablette uniquement) : actions utiles dès l'arrivée.
 */
export function HomeShortcuts() {
  return (
    <nav aria-label="Accès rapides" className="bg-[#050505] lg:hidden">
      <div className="grid grid-cols-3 gap-2 px-4 pb-4 pt-1">
        {shortcuts.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="flex min-h-[4.9rem] min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-1.5 py-2.5 text-center transition hover:border-[#D89A1C]/60 hover:bg-white/[0.06] active:scale-95"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[#D89A1C]/50 bg-black/30 text-[#D89A1C]">
              <Icon className="h-5 w-5" />
            </span>
            <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold leading-tight text-[#F8F3EA]">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
