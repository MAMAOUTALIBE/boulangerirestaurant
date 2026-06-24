import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { siteConfig } from "@/lib/config";
import { emailHref, mapsHref, phoneHref } from "@/lib/contactLinks";

const infos = [
  {
    Icon: MapPin,
    label: siteConfig.contact.address,
    href: mapsHref,
    external: true,
  },
  { Icon: Phone, label: siteConfig.contact.phone, href: phoneHref },
  { Icon: Mail, label: siteConfig.contact.email, href: emailHref },
  { Icon: Clock, label: siteConfig.hours.summary, id: "horaires" },
];

/** Section Contact : coordonnées + formulaire connecté. */
export function ContactSection() {
  return (
    <section
      id="contact"
      className="bg-ink pb-0 pt-3 sm:pt-20 lg:pt-24 3xl:pt-32"
    >
      <div className="container-page">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold sm:text-sm">
          Contact
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-cream sm:mt-2 sm:text-4xl">
          Contactez-nous
        </h2>

        <div className="mt-4 grid gap-4 sm:mt-10 sm:gap-10 lg:grid-cols-2">
          <ul className="grid gap-2 sm:block sm:space-y-5">
            {infos.map(({ Icon, label, href, external, id }) => (
              <li
                key={label}
                id={id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5 sm:gap-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-gold sm:h-11 sm:w-11">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                {href ? (
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="min-w-0 text-sm text-cream/85 underline-offset-4 transition hover:text-gold hover:underline sm:text-base"
                  >
                    {label}
                  </a>
                ) : (
                  <span className="min-w-0 text-sm text-cream/85 sm:text-base">
                    {label}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_42%),#111111] p-3 sm:border-0 sm:bg-transparent sm:p-0">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
