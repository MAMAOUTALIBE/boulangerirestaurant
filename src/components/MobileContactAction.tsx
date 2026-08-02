"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Mail, MessageCircle, Phone, Send, X } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { buildContactLinks } from "@/lib/config";

export function MobileContactAction({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const siteConfig = useSiteConfig();
  const { phoneHref, emailHref } = buildContactLinks(siteConfig);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const options = [
    { label: "Appel téléphonique", href: phoneHref, Icon: Phone },
    {
      label: "WhatsApp",
      href: siteConfig.socials.whatsapp,
      Icon: MessageCircle,
    },
    { label: "Telegram", href: siteConfig.socials.telegram, Icon: Send },
    { label: "E-mail", href: emailHref, Icon: Mail },
  ].filter((option) => option.href);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {children}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-end justify-center sm:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Fermer les options de contact"
            />
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative z-10 w-full max-w-md rounded-t-[1.75rem] border border-gold/35 bg-[#090909] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-24px_70px_-35px_rgba(245,158,11,0.8)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
                    Contact
                  </p>
                  <h2
                    id={titleId}
                    className="mt-1 font-display text-xl font-bold text-cream"
                  >
                    Comment souhaitez-vous nous joindre ?
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-cream"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {options.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="flex min-h-[5.4rem] flex-col items-center justify-center gap-2 rounded-2xl border border-gold/25 bg-white/[0.045] px-2 text-center text-sm font-bold text-cream transition active:scale-[0.97] active:bg-gold/15"
                  >
                    <Icon className="h-6 w-6 text-gold" aria-hidden />
                    {label}
                  </a>
                ))}
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
