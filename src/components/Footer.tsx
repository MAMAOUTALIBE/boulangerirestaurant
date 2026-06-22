import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { footerLinks } from "@/data/services";
import { NewsletterForm } from "@/components/NewsletterForm";
import { siteConfig } from "@/lib/config";

/* --- Icônes de marque (SVG inline, absentes de lucide) --- */
function IconFacebook() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.2c3.2 0 3.58 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.31-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.12.32-.27.8-.31 1.7C3.43 8.5 3.42 8.85 3.42 12s0 3.5.07 4.74c.04.9.19 1.38.31 1.7.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.12.8.27 1.7.31 1.24.07 1.59.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.7-.31.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.12-.32.27-.8.31-1.7.07-1.24.07-1.59.07-4.74s0-3.5-.07-4.74c-.04-.9-.19-1.38-.31-1.7a2.86 2.86 0 0 0-.69-1.06 2.86 2.86 0 0 0-1.06-.69c-.32-.12-.8-.27-1.7-.31C15.5 4 15.15 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.14-.7a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
    </svg>
  );
}
function IconTikTok() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.1v12.4a2.4 2.4 0 1 1-2.1-2.38v-3.1a5.46 5.46 0 1 0 5.2 5.46V9.4a7.3 7.3 0 0 0 4.16 1.3V7.6a4.28 4.28 0 0 1-3.1-1.78Z" />
    </svg>
  );
}
function IconWhatsApp() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.23 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.79.98-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M21.9 4.08c.2-1.28-.95-2.3-2.1-1.82L3.2 9.18c-1.24.51-1.2 2.3.06 2.75l4.18 1.48 1.62 5.14c.39 1.24 1.99 1.57 2.84.59l2.33-2.69 4.26 3.15c1.1.81 2.66.18 2.88-1.17L21.9 4.08ZM5.02 10.67 18.9 4.88 8.48 12.2l-3.46-1.23Zm5.57 7.16-1.2-3.8 7.44-5.23-6.24 9.03Zm1.42-.6 2.62-3.78 4.67 3.46-.64 1.24-6.65-.92Z" />
    </svg>
  );
}

const socials = [
  { label: "Facebook", Icon: IconFacebook, href: siteConfig.socials.facebook },
  {
    label: "Instagram",
    Icon: IconInstagram,
    href: siteConfig.socials.instagram,
  },
  { label: "TikTok", Icon: IconTikTok, href: siteConfig.socials.tiktok },
  { label: "WhatsApp", Icon: IconWhatsApp, href: siteConfig.socials.whatsapp },
  { label: "Telegram", Icon: IconTelegram, href: siteConfig.socials.telegram },
].filter((item) => Boolean(item.href));

const contact = [
  { Icon: MapPin, lines: [siteConfig.contact.address] },
  { Icon: Phone, lines: [siteConfig.contact.phone] },
  { Icon: Mail, lines: [siteConfig.contact.email] },
  { Icon: Clock, lines: ["Lun – Dim : 7h00 – 19h30"] },
];

const payments = ["VISA", "Mastercard", "PayPal", "Apple Pay"];

/** Pied de page complet : logo, réseaux, liens, contact, newsletter, paiements. */
export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-soft">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Marque + socials */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Pain frais, viennoiseries pur beurre et pâtisseries maison.
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Suivez-nous
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {socials.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Suivre ${siteConfig.name} sur ${label}`}
                  title={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-cream/80 transition hover:border-gold/60 hover:bg-gold hover:text-ink"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="font-display text-lg font-semibold text-cream">
              Liens rapides
            </h4>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted transition hover:text-gold"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold text-cream">
              Informations
            </h4>
            <ul className="mt-4 space-y-3">
              {contact.map(({ Icon, lines }, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>
                    {lines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-lg font-semibold text-cream">
              Newsletter
            </h4>
            <p className="mt-4 text-sm text-muted">
              Recevez nos offres, fournées spéciales et nouveautés
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Liens légaux */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs text-muted">
          <a href="/mentions-legales" className="transition hover:text-gold">
            Mentions légales
          </a>
          <a href="/cgv" className="transition hover:text-gold">
            CGV
          </a>
          <a href="/confidentialite" className="transition hover:text-gold">
            Politique de confidentialité
          </a>
          <a href="/compte" className="transition hover:text-gold">
            Espace client
          </a>
        </div>

        {/* Bas de footer */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-muted">
            © 2026 {siteConfig.name}. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {payments.map((p) => (
              <span
                key={p}
                className="rounded-md border border-white/10 bg-ink px-3 py-1.5 text-[11px] font-semibold text-cream/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
