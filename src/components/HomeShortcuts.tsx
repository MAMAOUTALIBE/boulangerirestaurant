import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { MobileContactAction } from "@/components/MobileContactAction";
import { getContentSection } from "@/lib/content";
import { SHORTCUT_CONTACT, SHORTCUT_DIRECTIONS } from "@/lib/content-blocks";
import { buildContactLinks } from "@/lib/config";
import { getSiteConfig } from "@/lib/site-settings";

/**
 * Accès rapides (mobile/tablette uniquement) : actions utiles dès l'arrivée.
 *
 * Libellés, ordre, destinations et icônes sont éditables depuis
 * /admin/contenus (section « raccourcis »). Deux destinations sont
 * symboliques et résolues ici contre l'identité du restaurant :
 * « contact » (feuille d'options pour nous joindre) et « itineraire »
 * (Google Maps vers l'adresse enregistrée) — jamais recopiées en dur.
 */
export async function HomeShortcuts() {
  const [raccourcis, siteConfig] = await Promise.all([
    getContentSection("raccourcis"),
    getSiteConfig(),
  ]);
  const { directionsHref } = buildContactLinks(siteConfig);

  const liens = raccourcis
    .filter((bloc) => bloc.href)
    .map((bloc) => ({
      ...bloc,
      href:
        bloc.href === SHORTCUT_DIRECTIONS
          ? directionsHref
          : (bloc.href as string),
    }));
  if (liens.length === 0) return null;

  return (
    <nav aria-label="Accès rapides" className="bg-[#050505] lg:hidden">
      <div className="home-shortcuts-grid grid grid-cols-4 gap-1.5 px-0 pb-3 pt-0">
        {liens.map((bloc, index) => {
          const className = `home-quick-action flex min-h-[4.1rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#D89A1C]/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] px-1.5 py-2 text-center shadow-[0_16px_38px_-30px_rgba(245,158,11,0.9)] transition hover:border-[#D89A1C]/60 hover:bg-white/[0.06] active:scale-95 ${
            index === 0 ? "home-quick-action-primary" : ""
          }`;
          const contenu = (
            <>
              <span
                className={`home-quick-icon grid h-9 w-9 place-items-center rounded-full border border-[#D89A1C]/50 bg-black/35 text-[#D89A1C] ${
                  index === 0 ? "home-quick-icon-primary" : ""
                }`}
              >
                <ContentIcon
                  name={bloc.icon}
                  fallback={ShoppingBag}
                  className="h-[1.125rem] w-[1.125rem]"
                />
              </span>
              <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] font-semibold leading-tight text-[#F8F3EA] min-[390px]:text-xs">
                {bloc.title}
              </span>
            </>
          );

          // « contact » n'est pas une URL : il ouvre la feuille de contact.
          if (bloc.href === SHORTCUT_CONTACT) {
            return (
              <MobileContactAction key={bloc.key} className={className}>
                {contenu}
              </MobileContactAction>
            );
          }

          // Navigation client pour les routes internes, lien brut sinon
          // (tel:, mailto:, Google Maps…).
          return bloc.href.startsWith("/") ? (
            <Link key={bloc.key} href={bloc.href} className={className}>
              {contenu}
            </Link>
          ) : (
            <a key={bloc.key} href={bloc.href} className={className}>
              {contenu}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
