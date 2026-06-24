"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import type { NavLink } from "@/types";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  cartCount: number;
}

const mainLinkHrefs = new Set([
  "/menu",
  "/commander",
  "/reservation",
  "/contact",
]);

/** Panneau de navigation mobile coulissant (hamburger menu). */
export function MobileNav({ open, onClose, links, cartCount }: MobileNavProps) {
  const mainLinks = links.filter((link) => mainLinkHrefs.has(link.href));
  const secondaryLinks = links.filter((link) => !mainLinkHrefs.has(link.href));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto bg-ink-soft px-5 py-5 shadow-card lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={onClose}
                aria-label="Fermer le menu"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-cream transition hover:border-gold/60 hover:text-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-8 space-y-3" aria-label="Pages du site">
              <MobileNavGroup
                title="Pages principales"
                links={mainLinks}
                onClose={onClose}
              />
              <MobileNavGroup
                title="Pages utiles"
                links={secondaryLinks}
                onClose={onClose}
              />
            </nav>

            <div className="mt-6 border-t border-white/10 pt-5">
              <a
                href="/compte"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sm font-medium text-cream/75 transition hover:text-gold"
              >
                <User className="h-4 w-4" />
                Mon compte
              </a>
            </div>

            {cartCount > 0 && (
              <a
                href="/commander"
                onClick={onClose}
                className="btn-primary mt-6 w-full"
              >
                <ShoppingBag className="h-4 w-4" />
                Finaliser le panier ({cartCount})
              </a>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileNavGroup({
  title,
  links,
  onClose,
}: {
  title: string;
  links: NavLink[];
  onClose: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
      <h3 className="border-b border-white/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gold">
        {title}
      </h3>
      <div className="py-1.5">
        {links.map((link, index) => (
          <motion.a
            key={link.href}
            href={link.href}
            onClick={onClose}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.03 * index }}
            className="group flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 text-left text-base font-medium text-cream/90 transition hover:bg-white/[0.045] hover:text-gold"
          >
            <span>{link.label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gold/70 transition group-hover:translate-x-0.5 group-hover:text-gold" />
          </motion.a>
        ))}
      </div>
    </section>
  );
}
