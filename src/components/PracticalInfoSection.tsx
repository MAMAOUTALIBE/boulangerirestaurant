import Link from "next/link";
import {
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/lib/config";

const orderSteps = [
  {
    step: "01",
    title: "Choisissez",
    text: "Pains, viennoiseries, pâtisseries, snacking et boissons.",
  },
  {
    step: "02",
    title: "Validez",
    text: "Créneau, coordonnées et paiement sécurisé.",
  },
  {
    step: "03",
    title: "Récupérez",
    text: "À emporter, livraison locale ou service sur place.",
  },
];

const practicalItems: {
  title: string;
  text: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "Livraison locale",
    text: "Juvisy-sur-Orge et alentours.",
    Icon: Truck,
  },
  {
    title: "Retrait rapide",
    text: "Commande prête au créneau choisi.",
    Icon: ShoppingBag,
  },
  {
    title: "Paiement simple",
    text: "Commande en ligne avec confirmation.",
    Icon: CreditCard,
  },
  {
    title: "Fabrication fraîche",
    text: "Pétrissage, cuisson et finition chaque jour.",
    Icon: ShieldCheck,
  },
];

/** Bandeau de réassurance placé avant la carte pour clarifier le parcours commande. */
export function PracticalInfoSection() {
  const phoneHref = `tel:${siteConfig.contact.phone.replace(/\s/g, "")}`;

  return (
    <section className="bg-[#F8F3EA] py-8 text-ink sm:py-10">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.2fr] lg:items-start">
          <Reveal>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600">
                Commande simple
              </p>
              <h2 className="mt-2 max-w-xl font-display text-2xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
                Tout est clair avant de commander.
              </h2>
              <p className="text-ink/68 mt-3 max-w-xl text-sm leading-7 sm:text-base">
                Le parcours est direct : vous choisissez vos produits, vous
                confirmez votre mode de service, puis l&apos;équipe prépare la
                commande.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/commander"
                  className="inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 rounded-full bg-gold px-7 py-3 text-sm font-black text-ink shadow-[0_16px_34px_-22px_rgba(239,164,29,0.95)] transition hover:-translate-y-0.5 hover:bg-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Commander
                </Link>
                <a
                  href={siteConfig.socials.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-[#25D366]/18 inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 rounded-full border border-[#25D366]/45 bg-[#25D366]/10 px-6 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:border-[#25D366] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50"
                >
                  <MessageCircle className="h-4 w-4 text-[#168B45]" />
                  WhatsApp
                </a>
                <a
                  href={phoneHref}
                  className="border-ink/12 inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 rounded-full border bg-white px-6 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:border-gold-600 hover:text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  <Phone className="h-4 w-4" />
                  {siteConfig.contact.phone}
                </a>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5">
            <Reveal delay={0.08}>
              <div className="grid gap-3 border-y border-ink/10 py-4 sm:grid-cols-3">
                {orderSteps.map((item) => (
                  <div key={item.step} className="flex gap-3 sm:block">
                    <span className="font-display text-2xl font-bold text-gold-600">
                      {item.step}
                    </span>
                    <div className="sm:mt-2">
                      <h3 className="text-base font-black text-ink">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-ink/65">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="grid gap-3 sm:grid-cols-2">
              {practicalItems.map(({ title, text, Icon }, index) => (
                <Reveal key={title} delay={0.06 * index}>
                  <div className="h-full rounded-lg border border-ink/10 bg-white p-4 shadow-[0_14px_34px_-30px_rgba(8,8,8,0.68)]">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-gold/45 bg-gold/10 text-gold-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-black text-ink">
                          {title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-ink/65">
                          {text}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.16}>
              <div className="grid gap-3 rounded-lg border border-forest/15 bg-forest/[0.07] p-4 text-sm font-semibold text-ink sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="flex items-center gap-2.5">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  <span>4.8/5 Google</span>
                </div>
                <span className="hidden h-8 w-px bg-ink/10 sm:block" />
                <div className="flex items-center gap-2.5 sm:justify-end">
                  <Clock3 className="h-4 w-4 text-gold-600" />
                  <span>11h30 - 23h00 · ven/sam jusqu&apos;à 00h00</span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <Link
                href="/menu"
                className="inline-flex w-full items-center justify-between rounded-lg border border-ink/10 bg-ink px-5 py-4 text-sm font-bold text-cream transition hover:-translate-y-0.5 hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <span className="inline-flex items-center gap-2.5">
                  <UtensilsCrossed className="h-4 w-4" />
                  Voir la carte complète
                </span>
                <span className="inline-flex items-center gap-1 text-gold">
                  Menu
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.24}>
          <div className="text-ink/62 mt-7 flex flex-col gap-2 border-t border-ink/10 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold-600" />
              {siteConfig.contact.address}
            </span>
            <span>Sur place · à emporter · livraison locale</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
