import Image from "next/image";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { getSiteConfig } from "@/lib/site-settings";
import { buildContactLinks } from "@/lib/contactLinks";

/** Section Contact : coordonnées + formulaire connecté. */
export async function ContactSection() {
  const siteConfig = await getSiteConfig();
  const { phoneHref, emailHref, mapsHref } = buildContactLinks(siteConfig);

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

  return (
    <section
      id="contact"
      className="bg-ink pb-6 pt-3 sm:pt-5 lg:h-[calc(100svh-7rem)] lg:pb-4 lg:pt-0 2xl:h-[calc(100svh-7.35rem)]"
    >
      <div className="container-page flex h-full flex-col">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold sm:text-sm">
          Contact
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-cream sm:mt-1.5 sm:text-4xl lg:text-[2.7rem]">
          Contactez-nous
        </h2>

        <div className="mt-4 grid min-h-0 flex-1 gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="min-h-0 space-y-4 lg:flex lg:flex-col lg:rounded-[24px] lg:border lg:border-white/10 lg:bg-[radial-gradient(circle_at_top_left,rgba(216,154,28,0.11),transparent_38%),#111111] lg:p-4 lg:shadow-[0_28px_85px_-62px_rgba(0,0,0,0.95)]">
            <ul className="grid gap-2 sm:grid-cols-2 lg:gap-3">
              {infos.map(({ Icon, label, href, external, id }) => (
                <li
                  key={label}
                  id={id}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5 sm:gap-3 sm:rounded-2xl sm:bg-white/[0.035] sm:px-3 sm:py-3 lg:min-h-[4.35rem] lg:border-white/10 lg:py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-gold sm:h-10 sm:w-10">
                    <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" />
                  </span>
                  {href ? (
                    <a
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="min-w-0 text-sm leading-snug text-cream/85 underline-offset-4 transition hover:text-gold hover:underline sm:text-[0.95rem] lg:text-sm xl:text-[0.95rem]"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="min-w-0 text-sm leading-snug text-cream/85 sm:text-[0.95rem] lg:text-sm xl:text-[0.95rem]">
                      {label}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div className="relative hidden min-h-0 flex-1 overflow-hidden rounded-[22px] border border-white/10 lg:block">
              <Image
                src="/images/africain/attieke-poisson-alloco.webp"
                alt="Assiette d'attiéké, poisson et alloco Lauuale Simbo"
                fill
                sizes="36vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 font-display text-xl font-bold leading-tight text-cream xl:text-2xl">
                Passez nous voir ou écrivez-nous, l&apos;équipe répond
                rapidement.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_42%),#111111] p-3 sm:rounded-[24px] sm:border-white/10 sm:p-5 lg:flex lg:min-h-0 lg:items-center lg:p-5 xl:p-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
