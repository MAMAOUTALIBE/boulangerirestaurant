import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/lib/config";

const infos = [
  { Icon: MapPin, label: siteConfig.contact.address },
  { Icon: Phone, label: siteConfig.contact.phone },
  { Icon: Mail, label: siteConfig.contact.email },
  { Icon: Clock, label: "Lun – Dim : 7h00 – 19h30" },
];

/** Section Contact : coordonnées + formulaire connecté. */
export function ContactSection() {
  return (
    <section id="contact" className="section bg-ink">
      <div className="container-page">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">
            Contact
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-cream sm:text-4xl">
            Contactez-nous
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <ul className="space-y-5">
              {infos.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 text-gold">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-cream/85">{label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
