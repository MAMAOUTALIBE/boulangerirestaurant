import { Clock, Mail, MapPin, Phone, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { emailHref, mapsHref, phoneHref } from "@/lib/contactLinks";

interface InformationRow {
  Icon: LucideIcon;
  label: string;
  href?: string;
  external?: boolean;
  ariaLabel?: string;
}

const informationRows: InformationRow[] = [
  {
    Icon: MapPin,
    label: siteConfig.contact.address,
    href: mapsHref,
    external: true,
    ariaLabel: "Voir l'adresse sur la carte",
  },
  {
    Icon: Phone,
    label: siteConfig.contact.phone,
    href: phoneHref,
    ariaLabel: "Appeler le restaurant",
  },
  {
    Icon: Mail,
    label: `Contact : ${siteConfig.contact.email}`,
    href: emailHref,
    ariaLabel: "Envoyer un email au restaurant",
  },
  {
    Icon: Clock,
    label: siteConfig.hours.summary,
  },
];

export function MobileInformationPanel({
  className = "",
}: {
  className?: string;
}) {
  return (
    <section
      aria-labelledby="mobile-footer-information-title"
      className={`rounded-[1.55rem] border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.075),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01)),#070707] px-4 py-5 shadow-[0_24px_80px_-62px_rgba(245,158,11,0.8)] ${className}`}
    >
      <div className="flex items-center gap-3 text-gold/75" aria-hidden="true">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/65 to-gold/25" />
        <UtensilsCrossed className="h-7 w-7 text-gold" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/65 to-gold/25" />
      </div>

      <h3
        id="mobile-footer-information-title"
        className="mt-4 text-center text-lg font-black uppercase tracking-[0.36em] text-gold"
      >
        Informations
      </h3>

      <div className="mt-5 divide-y divide-gold/15">
        {informationRows.map(({ Icon, label, href, external, ariaLabel }) => {
          const content = (
            <>
              <Icon className="h-8 w-8 shrink-0 text-gold" />
              <span className="text-cream/82 min-w-0 flex-1 text-[1.02rem] leading-snug">
                {label}
              </span>
            </>
          );

          if (href) {
            return (
              <a
                key={label}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                aria-label={ariaLabel}
                className="flex min-h-[4.8rem] items-center gap-5 py-4 transition hover:text-gold"
              >
                {content}
              </a>
            );
          }

          return (
            <div
              key={label}
              className="flex min-h-[4.8rem] items-center gap-5 py-4"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
