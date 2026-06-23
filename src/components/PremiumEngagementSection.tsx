import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ChevronRight,
  Clock,
  Coffee,
  Croissant,
  ExternalLink,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Quote,
  Send,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MobileTestimonialsCompact } from "@/components/MobileTestimonialsCompact";
import {
  PremiumContactForm,
  PremiumReviewForm,
} from "@/components/PremiumEngagementForms";
import { NewsletterForm } from "@/components/NewsletterForm";
import { testimonials } from "@/data/testimonials";
import { siteConfig } from "@/lib/config";
import { emailHref, mapsHref, phoneHref } from "@/lib/contactLinks";

const footerServices = [
  { label: "Pains & viennoiseries du jour", Icon: Croissant },
  { label: "Click & collect", Icon: Clock },
  { label: "Livraison locale", Icon: Truck },
  { label: "Pause café sur place", Icon: Coffee },
];

const qrBenefits = [
  { label: "Accédez à tout le menu", Icon: Clock },
  { label: "Commande rapide et sécurisée", Icon: ShieldCheck },
  { label: "Retrait sur place ou livraison", Icon: Truck },
];

function Stars({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div className="flex gap-1" aria-label="Note 5 sur 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size === "md" ? "h-6 w-6" : "h-4 w-4"} fill-gold text-gold`}
        />
      ))}
    </div>
  );
}

function GoogleMark() {
  return (
    <span
      aria-hidden
      className="grid h-11 w-11 place-items-center rounded-full bg-white text-3xl font-bold"
    >
      <span className="bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
        G
      </span>
    </span>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-gold/40 text-gold">
        <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
          <path
            d="M11 25h26v3c0 7-5 12-13 12S11 35 11 28v-3Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 25c0-5 4-9 8-9s8 4 8 9"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M13 31h28M8 25h32M21 11h6M24 6v5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <div className="leading-none">
        <p className="font-display text-3xl font-bold tracking-tight text-cream">
          {siteConfig.shortName}
        </p>
      </div>
    </div>
  );
}

function SocialIcon({ label }: { label: string }) {
  const base = "h-4 w-4";
  if (label === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="currentColor" aria-hidden>
        <path d="M14 8.5V6.8c0-.8.5-1 1.1-1H17V3.2A22 22 0 0 0 14.4 3C11.8 3 10 4.6 10 7.5v2H7v3h3V21h3.4v-8.5h2.8l.4-3H13.4v-1c0-.7.2-1 1-1H14Z" />
      </svg>
    );
  }
  if (label === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="currentColor" aria-hidden>
        <path d="M7.5 2.5h9A5 5 0 0 1 21.5 7.5v9a5 5 0 0 1-5 5h-9A5 5 0 0 1 2.5 16.5v-9a5 5 0 0 1 5-5Zm0 2A3 3 0 0 0 4.5 7.5v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.4-2.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" />
      </svg>
    );
  }
  if (label === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="currentColor" aria-hidden>
        <path d="M16.5 5.5A5.2 5.2 0 0 1 15 2.8h-3.1v12a2.4 2.4 0 1 1-2-2.3V9.4a5.5 5.5 0 1 0 5.1 5.5V8.5a8 8 0 0 0 4 1V6.4a4.8 4.8 0 0 1-2.5-.9Z" />
      </svg>
    );
  }
  return <MessageCircle className={base} />;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/[0.08] bg-[#0D0D0D]/95 shadow-[0_22px_60px_-50px_rgba(0,0,0,0.9)] ${className}`}
    >
      {children}
    </div>
  );
}

function MobileFooter() {
  const socials = [
    { label: "Facebook", href: siteConfig.socials.facebook },
    { label: "Instagram", href: siteConfig.socials.instagram },
    { label: "TikTok", href: siteConfig.socials.tiktok },
    { label: "WhatsApp", href: siteConfig.socials.whatsapp },
  ];

  const quickLinks = [
    [
      { label: "Accueil", href: "/" },
      { label: "Menu", href: "/menu" },
      { label: "Commander", href: "/commander" },
      { label: "Réservation", href: "/reservation" },
      { label: "Contact", href: "/contact" },
    ],
    [
      { label: "Boutique de saison", href: "/boutique-de-saison" },
      { label: "Sur-mesure", href: "/sur-mesure" },
      { label: "Traiteur", href: "/traiteur" },
      { label: "Avis", href: "/#avis-clients" },
      { label: "À propos", href: "/#a-propos" },
    ],
  ] as const;

  return (
    <footer className="border-t border-white/[0.08] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_34%),linear-gradient(180deg,#080808,#050505)] px-4 pb-5 pt-7 sm:hidden">
      <Link
        href="/"
        aria-label="Boulangerie Artisanale - Accueil"
        className="mx-auto grid w-fit justify-items-center text-center"
      >
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-gold bg-black/30 text-gold shadow-[0_0_34px_-18px_rgba(245,158,11,0.95)]">
          <svg
            viewBox="0 0 48 48"
            className="h-10 w-10"
            fill="none"
            aria-hidden
          >
            <path
              d="M11 25h26v3c0 7-5 12-13 12S11 35 11 28v-3Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16 25c0-5 4-9 8-9s8 4 8 9"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M13 31h28M8 25h32M21 11h6M24 6v5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="mt-3 font-display text-3xl font-bold leading-none text-cream">
          {siteConfig.shortName}
        </span>
      </Link>

      <p className="mx-auto mt-3 max-w-xs text-center text-sm leading-5 text-cream/70">
        Pain frais, viennoiseries pur beurre et pâtisseries maison.
      </p>

      <p className="mt-5 text-center text-xs font-bold uppercase tracking-[0.32em] text-gold">
        Suivez-nous
      </p>

      <nav
        aria-label="Réseaux sociaux"
        className="mt-3 flex items-center justify-center gap-3"
      >
        {socials.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.02] text-cream/85 shadow-[0_16px_36px_-28px_rgba(255,255,255,0.7)] transition hover:border-gold/60 hover:text-gold"
          >
            <span className="[&_svg]:h-5 [&_svg]:w-5">
              <SocialIcon label={label} />
            </span>
          </a>
        ))}
      </nav>

      <div className="my-5 h-px bg-white/10" />

      <FooterMobileHeading>Liens rapides</FooterMobileHeading>
      <nav
        aria-label="Liens rapides du pied de page"
        className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3"
      >
        {quickLinks.map((column, columnIndex) => (
          <ul key={columnIndex} className="space-y-3">
            {column.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex min-h-7 items-center justify-between gap-2 text-sm text-cream transition hover:text-gold"
                >
                  <span className="min-w-0">{link.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-cream transition group-hover:translate-x-0.5 group-hover:text-gold" />
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </nav>

      <div className="my-5 h-px bg-white/10" />

      <FooterMobileHeading>Informations</FooterMobileHeading>
      <div className="mt-4 space-y-3 text-sm leading-5 text-cream/70">
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3"
        >
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>{siteConfig.contact.address}</span>
        </a>
        <a href={phoneHref} className="flex gap-3">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>{siteConfig.contact.phone}</span>
        </a>
        <a href={emailHref} className="flex gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>{siteConfig.contact.email}</span>
        </a>
        <div className="flex gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>Lun - Dim : 7h00 - 19h30</span>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-[0_24px_70px_-58px_rgba(255,255,255,0.7)]">
        <FooterMobileHeading>Newsletter</FooterMobileHeading>
        <p className="text-cream/78 mt-2 text-sm leading-5">
          Recevez nos offres, fournées spéciales et nouveautés
        </p>
        <div className="[&_button]:h-11 [&_button]:w-11 [&_button]:shrink-0 [&_button]:px-0 [&_input]:h-11 [&_input]:bg-black/35 [&_input]:text-sm">
          <NewsletterForm />
        </div>
      </section>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted">
        <Lock className="h-4 w-4" />
        <span>© 2026 {siteConfig.shortName} · Tous droits réservés</span>
      </p>
    </footer>
  );
}

function FooterMobileHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.28em] text-gold">
      {children}
    </h3>
  );
}

export async function PremiumEngagementSection() {
  const qrSvg = await QRCode.toString(`${siteConfig.url}/commander`, {
    type: "svg",
    margin: 1,
    color: { dark: "#050505", light: "#ffffff" },
  });

  return (
    <section
      id="avis-clients"
      className="scroll-mt-24 bg-[#050505] px-4 py-4 text-cream sm:px-6 sm:py-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1600px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#080808] shadow-[0_30px_80px_-60px_rgba(0,0,0,0.95)]">
        <div className="px-4 pb-5 pt-4 sm:px-8 lg:px-8">
          <MobileTestimonialsCompact />

          <div className="hidden sm:block">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4">
                <span className="hidden h-px w-20 bg-gold sm:block" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-cream sm:text-4xl">
                  Ils parlent de <span className="text-gold">nous</span>
                </h2>
                <span className="hidden h-px w-20 bg-gold sm:block" />
              </div>
              <p className="mt-1.5 text-sm text-cream/80">
                Vos avis nous motivent chaque jour à proposer le meilleur du
                fait maison.
              </p>
            </div>

            <div className="mt-3 grid gap-4 xl:grid-cols-[0.86fr_1.38fr_1fr]">
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <Star className="h-7 w-7 text-gold" />
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-wide">
                      Laissez un avis
                    </h3>
                    <p className="mt-0.5 text-sm text-cream/70">
                      Votre retour aide les autres gourmands.
                    </p>
                  </div>
                </div>
                <div className="mt-3 hidden sm:block">
                  <PremiumReviewForm />
                </div>

                <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <div className="flex items-center gap-3">
                    <GoogleMark />
                    <div>
                      <Stars />
                      <p className="mt-1 text-lg font-semibold">
                        Note <span className="font-bold text-cream">4,8/5</span>{" "}
                        sur Google
                      </p>
                      <p className="mt-1 text-sm text-cream/70">
                        Basé sur +230 avis clients
                      </p>
                      <a
                        href="https://www.google.com/search?q=boulangerie+avis"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition hover:text-gold-400"
                      >
                        Voir tous les avis sur Google
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="border-white/[0.08] xl:border-x xl:px-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/50 text-gold">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold uppercase tracking-wide">
                    Ce qu&apos;ils disent de nous
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {testimonials.slice(0, 2).map((item) => (
                    <Card key={item.id} className="relative p-3.5">
                      <Quote className="absolute right-4 top-3.5 h-7 w-7 text-gold" />
                      <div className="flex gap-3.5 pr-10">
                        <Image
                          src={item.avatar}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/50"
                        />
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <Stars />
                          <blockquote className="mt-1.5 max-w-xl text-sm leading-relaxed text-cream/80">
                            &ldquo;{item.comment}&rdquo;
                          </blockquote>
                          {item.city && (
                            <p className="mt-1.5 text-xs uppercase tracking-wider text-cream/55">
                              {item.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-2.5 text-center">
                  <Link
                    href="#avis-clients"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/70 px-5 py-2 text-sm font-semibold text-gold transition hover:bg-gold hover:text-ink"
                  >
                    Voir plus d&apos;avis
                    <ArrowMini />
                  </Link>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3].map((dot) => (
                      <span
                        key={dot}
                        className={`h-2 w-2 rounded-full ${
                          dot === 0 ? "bg-gold" : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Card className="p-4">
                <div id="contact" className="-mt-24 pt-24" />
                <div className="flex items-center gap-3">
                  <Send className="h-7 w-7 text-gold" />
                  <h3 className="text-lg font-bold uppercase tracking-wide">
                    Contactez-nous
                  </h3>
                </div>

                <div className="mt-3 hidden sm:block">
                  <PremiumContactForm />
                </div>
              </Card>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-gold/25 bg-[#F8F3EA] text-[#050505] shadow-[0_24px_70px_-50px_rgba(216,154,28,0.72)]">
              <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_auto_1.2fr_1.6fr] lg:items-center">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-gold/60 bg-white text-gold-600 shadow-[0_16px_32px_-26px_rgba(5,5,5,0.45)]">
                    <QrCode className="h-8 w-8" />
                  </span>
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-[#050505]">
                      Commandez en un scan
                    </h3>
                    <p className="text-[#050505]/68 mt-1 text-sm leading-relaxed">
                      Scannez le QR code, accédez au menu et commandez en
                      quelques secondes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div
                    className="h-24 w-24 overflow-hidden rounded-xl border border-gold/70 bg-white p-1.5 shadow-[0_18px_34px_-26px_rgba(5,5,5,0.7)] sm:h-28 sm:w-28 [&>svg]:h-full [&>svg]:w-full"
                    aria-label="QR code de commande"
                    role="img"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                  <span className="hidden text-gold md:block" aria-hidden>
                    <CurvedArrow />
                  </span>
                </div>

                <div className="rounded-2xl border border-gold/55 bg-white p-4 text-center shadow-[0_18px_40px_-32px_rgba(5,5,5,0.55)]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#050505]/55">
                    Code Promo
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-gold-600">
                    BOULANGERIE10
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#050505]">
                    -10% sur votre première commande
                  </p>
                </div>

                <div className="hidden gap-4 sm:grid sm:grid-cols-3">
                  {qrBenefits.map(({ label, Icon }) => (
                    <div
                      key={label}
                      className="border-[#050505]/10 text-center sm:border-l sm:px-4"
                    >
                      <Icon className="mx-auto h-8 w-8 text-gold-600" />
                      <p className="mt-2 text-sm font-semibold leading-snug">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <MobileFooter />

        <footer className="hidden border-t border-white/[0.08] px-5 py-8 sm:block sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr_1.1fr_1.2fr_1.25fr]">
            <div>
              <BrandLogo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">
                Pain frais, viennoiseries pur beurre et pâtisseries maison.
              </p>
              <div className="mt-4 flex gap-3">
                {[
                  { label: "Facebook", href: siteConfig.socials.facebook },
                  { label: "Instagram", href: siteConfig.socials.instagram },
                  { label: "TikTok", href: siteConfig.socials.tiktok },
                  { label: "WhatsApp", href: siteConfig.socials.whatsapp },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-gold/60 text-gold transition hover:bg-gold hover:text-ink"
                  >
                    <SocialIcon label={label} />
                  </a>
                ))}
              </div>
            </div>

            <FooterColumn title="Contact">
              <FooterLine Icon={Phone} text={siteConfig.contact.phone} />
              <FooterLine Icon={Mail} text={siteConfig.contact.email} />
              <FooterLine Icon={MapPin} text={siteConfig.contact.address} />
            </FooterColumn>

            <FooterColumn title="Horaires">
              <TimeRow day="Lundi - Vendredi" time="7h00 - 19h30" />
              <TimeRow day="Samedi" time="7h00 - 20h00" />
              <TimeRow day="Dimanche" time="7h30 - 13h00" />
            </FooterColumn>

            <FooterColumn title="Services">
              {footerServices.map(({ label, Icon }) => (
                <FooterLine key={label} Icon={Icon} text={label} />
              ))}
            </FooterColumn>

            <FooterColumn title="Nous trouver">
              <div className="relative h-32 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#15110c]">
                <div className="absolute inset-0 bg-[linear-gradient(35deg,rgba(216,154,28,0.12)_1px,transparent_1px),linear-gradient(125deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
                <MapPin className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-gold" />
                <Link
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/20 bg-ink/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream transition hover:border-gold hover:text-gold"
                >
                  Voir sur la carte
                </Link>
              </div>
            </FooterColumn>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 text-sm text-cream/60 lg:flex-row">
            <p>© 2026 {siteConfig.name} - Tous droits réservés.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              <Link
                href="/mentions-legales"
                className="underline-offset-4 hover:text-gold hover:underline"
              >
                Mentions légales
              </Link>
              <Link
                href="/confidentialite"
                className="underline-offset-4 hover:text-gold hover:underline"
              >
                Politique de confidentialité
              </Link>
              <Link
                href="/cgv"
                className="underline-offset-4 hover:text-gold hover:underline"
              >
                CGV
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-gold">
        {title}
      </h3>
      <div className="mt-4 space-y-3 text-sm text-cream/75">{children}</div>
    </div>
  );
}

function FooterLine({ Icon, text }: { Icon: LucideIcon; text: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <span>{text}</span>
    </div>
  );
}

function TimeRow({ day, time }: { day: string; time: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4">
      <span>{day}</span>
      <span>{time}</span>
    </div>
  );
}

function CurvedArrow() {
  return (
    <svg viewBox="0 0 80 48" className="h-12 w-20" fill="none" aria-hidden>
      <path
        d="M5 12c18 28 43 30 62 9"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M55 20h14v14"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowMini() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
