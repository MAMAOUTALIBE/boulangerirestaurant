"use client";

import { useEffect, useState } from "react";
import {
  CakeSlice,
  CalendarDays,
  Croissant,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { MobileNav } from "@/components/MobileNav";
import { navLinks } from "@/data/services";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useOrderChoice } from "@/context/OrderContext";
import { useLang } from "@/context/LangContext";
import { siteConfig } from "@/lib/config";

/** Liens masqués dans l'en-tête pour l'aérer (restent accessibles via footer). */
const HEADER_HIDDEN_HREFS = [
  "/commander",
  "/traiteur",
  "/contact",
  "/boutique-de-saison",
  "/anti-gaspi",
];
const headerLinks = navLinks.filter(
  (link) => !HEADER_HIDDEN_HREFS.includes(link.href),
);
const phoneHref = `tel:${siteConfig.contact.phone.replace(/\s/g, "")}`;

/** En-tête sticky avec navigation desktop, panier et menu mobile. */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { totalCount: cartCount, setOpen: setCartOpen } = useCart();
  const { choice } = useOrderChoice();
  const { t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-3 z-50 px-3 transition-all duration-300 sm:top-4 sm:px-6 3xl:px-10",
        scrolled && "top-3",
      )}
    >
      <div
        className={cn(
          "mx-auto grid h-[68px] w-full max-w-[1800px] grid-cols-[auto_auto] items-center justify-between gap-3 rounded-[22px] border border-gold/35 bg-[linear-gradient(110deg,rgba(5,5,5,0.94)_0%,rgba(19,16,12,0.92)_45%,rgba(77,50,9,0.55)_100%)] px-3 shadow-[0_22px_70px_-45px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:h-[78px] sm:gap-4 sm:rounded-[28px] sm:px-5 lg:h-[90px] lg:grid-cols-[auto_auto_auto] lg:gap-5 lg:px-6 xl:grid-cols-[auto_auto_minmax(300px,1fr)_auto] xl:gap-6 2xl:h-[96px] 2xl:max-w-[1880px] 2xl:grid-cols-[auto_auto_minmax(420px,1fr)_auto] 2xl:gap-7 2xl:px-8 3xl:h-[104px] 3xl:max-w-[2200px] 3xl:gap-10 4xl:max-w-[2460px]",
          scrolled &&
            "h-[64px] border-gold/45 bg-[linear-gradient(110deg,rgba(5,5,5,0.96)_0%,rgba(19,16,12,0.94)_45%,rgba(77,50,9,0.62)_100%)] shadow-[0_18px_55px_-42px_rgba(216,154,28,0.5)] sm:h-[72px] lg:h-[82px] 2xl:h-[86px] 3xl:h-[92px]",
        )}
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-5 2xl:gap-6">
          <Logo className="shrink-0" />
          <span className="hidden h-12 w-px bg-gold/25 lg:block" aria-hidden />
        </div>

        <nav className="hidden items-center justify-center gap-4 lg:flex xl:gap-5 2xl:gap-7 3xl:gap-9">
          {headerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-cream/88 group relative inline-flex items-center gap-2 text-sm font-semibold transition hover:text-white 2xl:gap-2.5 2xl:text-base 3xl:text-lg"
            >
              {link.href === "/reservation" ? (
                <CalendarDays className="h-[1.125rem] w-[1.125rem] text-[#D89A1C] 2xl:h-5 2xl:w-5" />
              ) : link.href === "/sur-mesure" ? (
                <CakeSlice className="h-[1.125rem] w-[1.125rem] text-[#D89A1C] 2xl:h-5 2xl:w-5" />
              ) : (
                <Croissant className="h-[1.125rem] w-[1.125rem] text-[#D89A1C] 2xl:h-5 2xl:w-5" />
              )}
              {t(`nav.${link.href}`, link.label)}
              <span className="absolute -bottom-2 left-1/2 h-px w-0 -translate-x-1/2 bg-[#D89A1C] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <form
          action="/menu"
          className="border-white/28 bg-black/32 hidden h-14 min-w-0 items-center gap-3 rounded-full border px-4 text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition focus-within:border-gold/70 xl:flex 2xl:h-16 2xl:px-5 3xl:h-[4.5rem] 3xl:px-6"
          role="search"
        >
          <Search className="h-5 w-5 shrink-0 text-[#D89A1C] 3xl:h-6 3xl:w-6" />
          <input
            name="q"
            type="search"
            aria-label="Rechercher un pain, une pâtisserie ou une boisson"
            placeholder="Rechercher pain, pâtisserie, boisson..."
            className="placeholder:text-cream/46 min-w-0 flex-1 bg-transparent text-sm font-medium text-cream focus:outline-none 2xl:text-base 3xl:text-lg"
          />
          <button
            type="submit"
            aria-label="Lancer la recherche"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream/80 transition hover:bg-white/[0.08] hover:text-gold 3xl:h-12 3xl:w-12"
          >
            <SlidersHorizontal className="h-5 w-5 3xl:h-6 3xl:w-6" />
          </button>
        </form>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-3 2xl:gap-4">
          <a
            href={phoneHref}
            className="bg-black/28 hidden min-h-[3rem] items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-cream transition hover:-translate-y-0.5 hover:border-[#D89A1C]/70 hover:text-[#D89A1C] 2xl:inline-flex 3xl:min-h-[3.5rem] 3xl:px-5 3xl:text-base"
          >
            <Phone className="h-4 w-4 text-[#D89A1C]" />
            {siteConfig.contact.phone}
          </a>

          <button
            aria-label={`Voir le panier (${cartCount} article${cartCount > 1 ? "s" : ""})`}
            onClick={() => setCartOpen(true)}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.03] text-cream transition hover:-translate-y-0.5 hover:border-[#D89A1C]/70 hover:text-[#D89A1C] sm:h-12 sm:w-12 lg:h-[3.25rem] lg:w-[3.25rem] 2xl:h-14 2xl:w-14 3xl:h-16 3xl:w-16"
          >
            <ShoppingBag className="h-5 w-5 2xl:h-6 2xl:w-6" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#D89A1C] text-[11px] font-bold text-[#050505]">
                {cartCount}
              </span>
            )}
          </button>

          <a
            href="/commander"
            className="hidden min-h-[3.25rem] items-center justify-center gap-2.5 rounded-full bg-[#D89A1C] px-5 py-3 text-sm font-bold text-[#050505] shadow-[0_16px_42px_-24px_rgba(216,154,28,0.95)] transition hover:-translate-y-0.5 hover:bg-[#f0ad2f] sm:inline-flex lg:px-6 xl:px-7 2xl:min-h-[3.5rem] 2xl:gap-3 2xl:px-9 2xl:text-base 3xl:min-h-[4rem] 3xl:px-10 3xl:text-lg"
          >
            <ShoppingBag className="h-5 w-5" />
            {t("cta.order", "Commander")}
          </a>

          <button
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.03] text-cream transition hover:border-[#D89A1C]/70 hover:text-[#D89A1C] sm:h-12 sm:w-12 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {choice && pathname === "/commander" && (
        <Link
          href="/commander"
          className="mx-auto mt-2 flex w-fit items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/90 px-4 py-1.5 text-center text-xs font-semibold text-ink shadow-[0_10px_28px_-18px_rgba(216,154,28,0.9)] transition hover:bg-gold"
        >
          {choice.label} · modifier
        </Link>
      )}

      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        links={navLinks}
        cartCount={cartCount}
      />
    </header>
  );
}
