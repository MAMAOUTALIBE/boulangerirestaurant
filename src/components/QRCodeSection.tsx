import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowDownRight,
  ArrowRight,
  Clock,
  Gift,
  MessageCircle,
  PhoneCall,
  Send,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/lib/config";

const benefits = [
  {
    title: "Accédez au menu complet",
    detail: "Toute la carte du restaurant accessible en quelques clics.",
    Icon: UtensilsCrossed,
  },
  {
    title: "Commande rapide",
    detail: "Personnalisez puis validez votre commande en quelques secondes.",
    Icon: Clock,
  },
  {
    title: "Retrait ou livraison",
    detail: "À emporter, sur place ou livré selon votre choix.",
    Icon: Truck,
  },
];

const socials = [
  { label: "Instagram", href: siteConfig.socials.instagram, Icon: CameraIcon },
  { label: "WhatsApp", href: siteConfig.socials.whatsapp, Icon: MessageCircle },
  { label: "Telegram", href: siteConfig.socials.telegram, Icon: Send },
].filter((item) => Boolean(item.href));

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M16.5 3.5a2 2 0 0 1 1.8 1.1l.5 1H21a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7.6a2 2 0 0 1 2-2h2.2l.5-1a2 2 0 0 1 1.8-1.1h9Zm-4.5 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm6.7-.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}

/** Section premium QR code : smartphone, QR, promo, avantages et contact. */
export async function QRCodeSection() {
  const target = `${siteConfig.url}/commander`;
  const qrSvg = await QRCode.toString(target, {
    type: "svg",
    margin: 1,
    color: { dark: "#080808", light: "#ffffff" },
  });

  return (
    <Reveal>
      <div
        id="commander-qr"
        className="overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-[0_24px_58px_-40px_rgba(8,8,8,0.75)]"
      >
        <div className="grid gap-7 px-5 pb-8 pt-6 sm:px-7 lg:grid-cols-[250px_minmax(0,1fr)_320px] lg:gap-10 lg:px-8 lg:pb-9">
          <div className="mx-auto w-full max-w-[250px] lg:mx-0">
            <div className="rounded-[2.25rem] border-2 border-ink/70 bg-ink p-2 shadow-[0_20px_50px_-30px_rgba(8,8,8,0.95)]">
              <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-ink-soft p-3 text-cream">
                <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-black/85" />
                <p className="text-xs text-cream/70">Bonjour</p>
                <p className="mt-1 text-sm font-semibold">
                  Prêt à commander votre repas ?
                </p>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gold text-ink">
                    <Gift className="h-4 w-4" />
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    Commande confirmée
                  </p>
                  <p className="mt-1 text-xs text-cream/70">
                    Prêt dans 25 à 30 min
                  </p>
                  <Link
                    href="/commander"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold hover:text-ink"
                  >
                    Suivre la commande
                  </Link>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-cream/70">A venir chercher</p>
                  <p className="mt-1 text-sm font-semibold">
                    {siteConfig.name}
                  </p>
                  <p className="mt-1 text-xs text-cream/70">Juvisy-sur-Orge</p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="inline-flex rounded-lg bg-gold px-4 py-1 text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Nouveau
            </p>
            <h3 className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Commandez en un scan
            </h3>
            <p className="mt-3 max-w-xl text-base leading-7 text-ink/75">
              Scannez le QR code pour accéder au menu, commander rapidement et
              choisir livraison ou retrait.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div
                className="h-[220px] w-[220px] overflow-hidden rounded-xl border border-gold/50 bg-white p-2 shadow-[0_14px_30px_-20px_rgba(8,8,8,0.55)] [&>svg]:h-full [&>svg]:w-full"
                role="img"
                aria-label="QR code vers la page de commande"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gold-600">
                  <ArrowDownRight className="h-9 w-9" />
                  <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                    Scan immédiat
                  </span>
                </div>
                <div className="rounded-xl border border-ink/10 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                    Code Promo
                  </p>
                  <p className="mt-2 rounded-lg border border-dashed border-gold/60 bg-gold/10 px-4 py-2 font-display text-3xl font-bold text-gold-600">
                    -10%
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    sur votre première commande
                  </p>
                </div>
              </div>
            </div>

            <Link href="/commander" className="btn-primary mt-6">
              Commander maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4 border-ink/10 lg:border-l lg:pl-7">
            {benefits.map(({ title, detail, Icon }) => (
              <div
                key={title}
                className="border-b border-ink/10 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/50 text-gold-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-semibold leading-tight text-ink">
                      {title}
                    </p>
                    <p className="mt-1 text-base leading-6 text-ink/70">
                      {detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <p className="pt-1 font-display text-3xl italic text-ink/80">
              Simple, rapide, pratique.
            </p>
          </div>
        </div>

        <div className="grid gap-5 border-t border-white/10 bg-ink px-5 py-5 text-cream sm:px-7 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold text-ink">
              <PhoneCall className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gold">
                Besoin d&apos;aide ? Contactez-nous
              </p>
              <p className="text-2xl font-bold tracking-wide">
                {siteConfig.contact.phone}
              </p>
              <p className="text-sm text-cream/70">
                {siteConfig.hours.summary}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gold">Suivez-nous</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full border border-gold/50 text-gold transition hover:bg-gold hover:text-ink"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <Logo />
        </div>
      </div>
    </Reveal>
  );
}
