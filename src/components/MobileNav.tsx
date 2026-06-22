"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import type { NavLink } from "@/types";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  cartCount: number;
}

/** Panneau de navigation mobile coulissant (hamburger menu). */
export function MobileNav({ open, onClose, links, cartCount }: MobileNavProps) {
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
            className="fixed right-0 top-0 z-50 flex h-full w-[82%] max-w-sm flex-col bg-ink-soft p-6 shadow-card lg:hidden"
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

            <nav className="mt-10 flex flex-col gap-1">
              {links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className="rounded-xl px-4 py-3 text-lg font-medium text-cream/90 transition hover:bg-white/5 hover:text-gold"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>

            <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
              <a
                href="/compte"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sm font-medium text-cream/75 transition hover:text-gold"
              >
                <User className="h-4 w-4" />
                Mon compte
              </a>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/45">
                  Langue
                </span>
                <LangToggle />
              </div>
            </div>

            <a
              href="/commander"
              onClick={onClose}
              className="btn-primary mt-auto w-full"
            >
              <ShoppingBag className="h-4 w-4" />
              Commander {cartCount > 0 && `(${cartCount})`}
            </a>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
