/**
 * Contenus éditoriaux du site — pur / testable (pas de `server-only`, pas de DB).
 *
 * Ce module porte DEUX choses :
 *  1. `DEFAULT_CONTENT_BLOCKS` : le contenu livré avec le template, repris à
 *     l'identique de ce qui était auparavant codé en dur dans les composants.
 *     C'est le filet de sécurité : une base vide (nouveau client) ou
 *     indisponible affiche exactement le site d'origine.
 *  2. `resolveSection` : la fusion « base par-dessus défauts ».
 *
 * Règle de fusion : **dès qu'une ligne existe en base pour une clé, elle fait
 * autorité** pour tous les champs du formulaire. On évite ainsi l'ambiguïté
 * « champ vidé volontairement » vs « champ jamais renseigné » : tant que le
 * restaurateur n'a pas touché un bloc, il voit le défaut ; dès qu'il l'édite,
 * il en devient propriétaire. Les blocs qu'il crée en plus sont ajoutés à la fin.
 *
 * La lecture en base vit dans `src/lib/content.ts` (server-only).
 */

/** Emplacements connus. Sert de garde-fou aux Server Actions et à l'écran CRM. */
export const CONTENT_SECTIONS = [
  "hero",
  "menu-hero",
  "galerie",
  "a-propos",
  "a-propos-points",
  "etapes",
  "infos-pratiques",
  "qr-avantages",
  "raccourcis",
  "footer-atouts",
  "page-cgv",
  "page-mentions-legales",
  "page-confidentialite",
] as const;

export type ContentSection = (typeof CONTENT_SECTIONS)[number];

/** Libellés affichés dans le CRM, groupés par page. */
export const SECTION_LABELS: Record<ContentSection, string> = {
  hero: "Accueil — bandeau principal",
  "menu-hero": "Carte — bandeau",
  galerie: "Galerie — photos et vidéos",
  "a-propos": "Accueil — à propos",
  "a-propos-points": "Accueil — points forts",
  etapes: "Accueil — étapes de commande",
  "infos-pratiques": "Accueil — informations pratiques",
  "qr-avantages": "Accueil — avantages du QR code",
  raccourcis: "Accueil — accès rapides (mobile)",
  "footer-atouts": "Pied de page — mises en avant",
  "page-cgv": "Page — conditions générales de vente",
  "page-mentions-legales": "Page — mentions légales",
  "page-confidentialite": "Page — politique de confidentialité",
};

/** Sections dont le contenu est un texte long en Markdown (une seule ligne). */
export const SECTIONS_MARKDOWN: ContentSection[] = [
  "page-cgv",
  "page-mentions-legales",
  "page-confidentialite",
];

/**
 * Icônes utilisables dans un bloc. Liste blanche : le nom vient de la base,
 * donc d'une saisie — on ne fait jamais de résolution dynamique arbitraire.
 */
export const ICON_WHITELIST = [
  "ShoppingBag",
  "CalendarCheck",
  "UtensilsCrossed",
  "ChefHat",
  "UsersRound",
  "Truck",
  "CreditCard",
  "ShieldCheck",
  "Clock",
  "Leaf",
  "Flame",
  "Gift",
  "Recycle",
  "Images",
  "Star",
] as const;

export type IconName = (typeof ICON_WHITELIST)[number];

/** Renvoie le nom d'icône s'il est autorisé, sinon `undefined`. */
export function resolveIconName(name?: string | null): IconName | undefined {
  return name && (ICON_WHITELIST as readonly string[]).includes(name)
    ? (name as IconName)
    : undefined;
}

/** Un bloc de contenu résolu, prêt à l'affichage. */
export interface ContentBlockData {
  section: string;
  key: string;
  sortOrder: number;
  active: boolean;
  title?: string;
  subtitle?: string;
  body?: string;
  mediaUrl?: string;
  posterUrl?: string;
  alt?: string;
  href?: string;
  ctaLabel?: string;
  icon?: string;
  data?: Record<string, unknown>;
}

/** Ligne telle que lue en base (champs nullables). */
export interface ContentBlockRow {
  section: string;
  key: string;
  sortOrder?: number | null;
  active?: boolean | null;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  mediaUrl?: string | null;
  posterUrl?: string | null;
  alt?: string | null;
  href?: string | null;
  ctaLabel?: string | null;
  icon?: string | null;
  data?: unknown;
}

/** Convertit une ligne base en bloc affichable (null → absent). */
function fromRow(
  row: ContentBlockRow,
  ordreParDefaut: number,
): ContentBlockData {
  const texte = (value?: string | null) => value?.trim() || undefined;
  return {
    section: row.section,
    key: row.key,
    sortOrder: row.sortOrder ?? ordreParDefaut,
    active: row.active ?? true,
    title: texte(row.title),
    subtitle: texte(row.subtitle),
    body: texte(row.body),
    mediaUrl: texte(row.mediaUrl),
    posterUrl: texte(row.posterUrl),
    alt: texte(row.alt),
    href: texte(row.href),
    ctaLabel: texte(row.ctaLabel),
    icon: texte(row.icon),
    data:
      row.data && typeof row.data === "object"
        ? (row.data as Record<string, unknown>)
        : undefined,
  };
}

/**
 * Contenu affiché pour une section : les défauts du template, remplacés bloc à
 * bloc par ce qui a été personnalisé en base, plus les blocs ajoutés au CRM.
 * Les blocs désactivés sont retirés ; le tout est trié par ordre d'affichage.
 */
export function resolveSection(
  section: string,
  rows: ContentBlockRow[] = [],
): ContentBlockData[] {
  const defauts = DEFAULT_CONTENT_BLOCKS.filter((b) => b.section === section);
  const parCle = new Map(
    rows.filter((r) => r.section === section).map((r) => [r.key, r]),
  );

  const resolus: ContentBlockData[] = defauts.map((defaut) => {
    const ligne = parCle.get(defaut.key);
    parCle.delete(defaut.key);
    return ligne ? fromRow(ligne, defaut.sortOrder) : defaut;
  });

  // Blocs créés depuis le CRM (aucun équivalent dans le template).
  let rang = resolus.length;
  for (const ligne of parCle.values()) {
    resolus.push(fromRow(ligne, rang++));
  }

  return resolus
    .filter((b) => b.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Premier bloc actif d'une section (sections « à contenu unique »). */
export function resolveSingle(
  section: string,
  rows: ContentBlockRow[] = [],
): ContentBlockData | undefined {
  return resolveSection(section, rows)[0];
}

/** Vrai si le chemin désigne une vidéo (MP4, WebM ou MOV). */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(url);
}

/** Chaîne du champ libre `data` d'un bloc, ou `undefined`. */
export function blockText(
  bloc: ContentBlockData | undefined,
  cle: string,
): string | undefined {
  const valeur = bloc?.data?.[cle];
  return typeof valeur === "string" && valeur.trim() ? valeur : undefined;
}

/** Élément de galerie tel qu'attendu par `GallerySection`. */
export type GalleryEntry =
  | { type: "image"; src: string; alt: string; tag: string }
  | { type: "video"; src: string; poster: string; alt: string; tag: string };

/**
 * Convertit les blocs de la section « galerie » en médias affichables.
 * Un bloc est une vidéo dès que son média en est une ; l'affiche
 * (`posterUrl`) est alors l'image montrée avant lecture. Les blocs sans média
 * sont ignorés — un bloc à moitié rempli ne doit pas casser le carrousel.
 */
export function toGalleryEntries(blocs: ContentBlockData[]): GalleryEntry[] {
  const entrees: GalleryEntry[] = [];
  for (const bloc of blocs) {
    if (!bloc.mediaUrl) continue;
    const alt = bloc.alt ?? bloc.title ?? "";
    const tag = blockText(bloc, "tag") ?? bloc.title ?? "";
    if (isVideoUrl(bloc.mediaUrl)) {
      entrees.push({
        type: "video",
        src: bloc.mediaUrl,
        poster: bloc.posterUrl ?? "",
        alt,
        tag,
      });
    } else {
      entrees.push({ type: "image", src: bloc.mediaUrl, alt, tag });
    }
  }
  return entrees;
}

/** Diapositive du bandeau d'accueil (`Hero`) ou de la carte (`MenuHero`). */
export type HeroSlide =
  | {
      type: "image";
      src: string;
      label: string;
      alt: string;
      durationMs?: number;
    }
  | {
      type: "video";
      src: string;
      poster: string;
      label: string;
      alt: string;
      durationMs?: number;
      mediaClassName: string;
      startAt: number;
    };

/** Entier positif du champ libre `data`, ou `undefined`. */
function blockNumber(bloc: ContentBlockData, cle: string): number | undefined {
  const valeur = bloc.data?.[cle];
  const nombre = typeof valeur === "number" ? valeur : Number(valeur);
  return Number.isFinite(nombre) && nombre >= 0 ? nombre : undefined;
}

/**
 * Convertit des blocs en diapositives. Une vidéo conserve son
 * affiche (`posterUrl`) et ses réglages de lecture (`data.mediaClassName`,
 * `data.startAt`). Les blocs sans média sont ignorés.
 */
export function toHeroSlides(blocs: ContentBlockData[]): HeroSlide[] {
  const diapos: HeroSlide[] = [];
  for (const bloc of blocs) {
    if (!bloc.mediaUrl) continue;
    const commun = {
      label: bloc.title ?? "",
      alt: bloc.alt ?? bloc.title ?? "",
      durationMs: blockNumber(bloc, "durationMs"),
    };
    if (isVideoUrl(bloc.mediaUrl)) {
      diapos.push({
        type: "video",
        src: bloc.mediaUrl,
        poster: bloc.posterUrl ?? "",
        mediaClassName: blockText(bloc, "mediaClassName") ?? "object-cover",
        startAt: blockNumber(bloc, "startAt") ?? 0,
        ...commun,
      });
    } else {
      diapos.push({ type: "image", src: bloc.mediaUrl, ...commun });
    }
  }
  return diapos;
}

/** Raccourci de déclaration d'un défaut. */
function bloc(
  section: ContentSection,
  key: string,
  sortOrder: number,
  reste: Omit<ContentBlockData, "section" | "key" | "sortOrder" | "active">,
): ContentBlockData {
  return { section, key, sortOrder, active: true, ...reste };
}

/**
 * Contenu d'origine du template — miroir exact de ce qui était codé en dur.
 * Modifier une valeur ici change le contenu d'un site NEUF ; les sites déjà
 * personnalisés ne sont pas affectés (leur ligne en base fait autorité).
 */
export const DEFAULT_CONTENT_BLOCKS: ContentBlockData[] = [
  // ── Accueil : bandeau principal ────────────────────────────────────────────
  bloc("hero", "saveurs", 1, {
    title: "Saveurs africaines",
    mediaUrl: "/images/africain/thiep-poisson.webp",
    alt: "Cuisine généreuse préparée minute chez Lauuale Simbo",
  }),
  bloc("hero", "thieb-poisson", 2, {
    title: "Thiéboudiène poisson",
    mediaUrl: "/images/africain/thiep-poisson.webp",
    alt: "Thiéboudiène au poisson, riz parfumé et légumes mijotés",
  }),
  bloc("hero", "yassa", 3, {
    title: "Yassa poulet",
    mediaUrl: "/images/africain/yassa-poulet.webp",
    alt: "Poulet yassa aux oignons confits et citron, servi avec du riz",
  }),
  bloc("hero", "mafe", 4, {
    title: "Mafé de bœuf",
    mediaUrl: "/images/africain/mafe-boeuf.webp",
    alt: "Mafé de bœuf dans sa sauce onctueuse à l'arachide",
  }),
  bloc("hero", "attieke", 5, {
    title: "Attiéké poisson & alloco",
    mediaUrl: "/images/africain/attieke-poisson-alloco.webp",
    alt: "Poisson grillé avec attiéké, alloco et crudités",
  }),
  bloc("hero", "boissons", 6, {
    title: "Boissons maison",
    mediaUrl: "/images/africain/boissons-bissap-gingembre-bouye.webp",
    alt: "Bissap, jus de gingembre et bouye préparés maison",
  }),

  // ── Carte : bandeau ────────────────────────────────────────────────────────
  bloc("menu-hero", "thieb", 1, {
    mediaUrl: "/images/africain/thiep-poisson.webp",
    alt: "Thiéboudiène au poisson et légumes mijotés",
  }),
  bloc("menu-hero", "yassa", 2, {
    mediaUrl: "/images/africain/yassa-poulet.webp",
    alt: "Poulet yassa aux oignons confits",
  }),
  bloc("menu-hero", "mafe", 3, {
    mediaUrl: "/images/africain/mafe-boeuf.webp",
    alt: "Mafé de bœuf à la sauce arachide",
  }),
  bloc("menu-hero", "attieke", 4, {
    mediaUrl: "/images/africain/attieke-poisson-alloco.webp",
    alt: "Attiéké, poisson grillé et alloco",
  }),

  // ── Galerie ────────────────────────────────────────────────────────────────
  bloc("galerie", "thieb-poisson", 1, {
    mediaUrl: "/images/africain/thiep-poisson.webp",
    alt: "Thiéboudiène au poisson et légumes mijotés",
    data: { tag: "Thiéboudiène" },
  }),
  bloc("galerie", "thieb-poulet", 2, {
    mediaUrl: "/images/africain/thiep-poulet.webp",
    alt: "Thiéboudiène au poulet mariné",
    data: { tag: "Thiéboudiène" },
  }),
  bloc("galerie", "yassa", 3, {
    mediaUrl: "/images/africain/yassa-poulet.webp",
    alt: "Yassa poulet aux oignons confits et citron",
    data: { tag: "Yassa" },
  }),
  bloc("galerie", "mafe", 4, {
    mediaUrl: "/images/africain/mafe-boeuf.webp",
    alt: "Mafé de bœuf à la sauce arachide",
    data: { tag: "Mafé" },
  }),
  bloc("galerie", "attieke", 5, {
    mediaUrl: "/images/africain/attieke-poisson-alloco.webp",
    alt: "Attiéké avec poisson grillé et alloco",
    data: { tag: "Attiéké" },
  }),
  bloc("galerie", "pastels", 6, {
    mediaUrl: "/images/africain/pastels-alloco.webp",
    alt: "Pastels maison et bananes plantain alloco",
    data: { tag: "Entrées" },
  }),
  bloc("galerie", "desserts", 7, {
    mediaUrl: "/images/africain/desserts-africains.webp",
    alt: "Assortiment de douceurs africaines maison",
    data: { tag: "Desserts" },
  }),
  bloc("galerie", "boissons", 8, {
    mediaUrl: "/images/africain/boissons-bissap-gingembre-bouye.webp",
    alt: "Bissap, jus de gingembre et bouye maison",
    data: { tag: "Boissons" },
  }),

  // ── Accueil : à propos ─────────────────────────────────────────────────────
  bloc("a-propos", "texte", 1, {
    subtitle: "À propos de nous",
    title: "Une cuisine africaine généreuse, pensée pour le partage",
    body: "Notre équipe prépare chaque jour les grands classiques d'Afrique de l'Ouest avec une exigence simple : des produits frais, des recettes généreuses et un accueil chaleureux, midi et soir.",
    href: "#contact",
    ctaLabel: "Découvrir notre histoire",
  }),
  bloc("a-propos", "photo-1", 2, {
    mediaUrl: "/images/africain/thiep-poulet.webp",
    alt: "Thiéboudiène au poulet Lauuale Simbo",
  }),
  bloc("a-propos", "photo-2", 3, {
    mediaUrl: "/images/africain/yassa-poulet.webp",
    alt: "Poulet yassa maison",
  }),
  bloc("a-propos", "photo-3", 4, {
    mediaUrl: "/images/africain/desserts-africains.webp",
    alt: "Desserts africains maison",
  }),

  // ── Accueil : points forts ─────────────────────────────────────────────────
  bloc("a-propos-points", "point-1", 1, {
    title: "Thiéboudiène, yassa et mafé faits maison",
  }),
  bloc("a-propos-points", "point-2", 2, {
    title: "Poissons et viandes marinés avec soin",
  }),
  bloc("a-propos-points", "point-3", 3, {
    title: "Alloco, pastels et desserts maison",
  }),
  bloc("a-propos-points", "point-4", 4, {
    title: "Équipe passionnée et accueillante",
  }),

  // ── Accueil : étapes de commande ───────────────────────────────────────────
  bloc("etapes", "choisir", 1, {
    title: "Choisissez",
    body: "Thiéboudiène, yassa, mafé, attiéké, grillades et desserts.",
    data: { numero: "01" },
  }),
  bloc("etapes", "valider", 2, {
    title: "Validez",
    body: "Créneau, coordonnées et paiement sécurisé.",
    data: { numero: "02" },
  }),
  bloc("etapes", "recuperer", 3, {
    title: "Récupérez",
    body: "À emporter, livraison locale ou service sur place.",
    data: { numero: "03" },
  }),

  // ── Accueil : informations pratiques ───────────────────────────────────────
  // `{ville}` est remplacé à l'affichage par la ville de /admin/parametres.
  bloc("infos-pratiques", "livraison", 1, {
    title: "Livraison locale",
    body: "{ville} et alentours.",
    icon: "Truck",
  }),
  bloc("infos-pratiques", "retrait", 2, {
    title: "Retrait rapide",
    body: "Commande prête au créneau choisi.",
    icon: "ShoppingBag",
  }),
  bloc("infos-pratiques", "paiement", 3, {
    title: "Paiement simple",
    body: "Commande en ligne avec confirmation.",
    icon: "CreditCard",
  }),
  bloc("infos-pratiques", "fraicheur", 4, {
    title: "Fabrication fraîche",
    body: "Préparation, cuisson et finition chaque jour.",
    icon: "ShieldCheck",
  }),

  // ── Accueil : avantages du QR code ─────────────────────────────────────────
  bloc("qr-avantages", "menu", 1, {
    title: "Accédez au menu complet",
    body: "Toute la carte du restaurant accessible en quelques clics.",
    icon: "UtensilsCrossed",
  }),
  bloc("qr-avantages", "rapidite", 2, {
    title: "Commande rapide",
    body: "Personnalisez puis validez votre commande en quelques secondes.",
    icon: "Clock",
  }),
  bloc("qr-avantages", "retrait", 3, {
    title: "Retrait ou livraison",
    body: "À emporter, sur place ou livré selon votre choix.",
    icon: "Truck",
  }),

  // ── Accueil : accès rapides (mobile) ───────────────────────────────────────
  bloc("raccourcis", "commander", 1, {
    title: "Commander",
    href: "/commander",
    icon: "ShoppingBag",
  }),
  bloc("raccourcis", "reserver", 2, {
    title: "Réserver",
    href: "/reservation",
    icon: "CalendarCheck",
  }),
  bloc("raccourcis", "menu", 3, {
    title: "Voir le menu",
    href: "/menu",
    icon: "UtensilsCrossed",
  }),

  // ── Pied de page : mises en avant ──────────────────────────────────────────
  bloc("footer-atouts", "commander", 1, {
    title: "Commander en ligne",
    body: "Plats africains et grillades à retirer ou en livraison.",
    href: "/commander",
    icon: "ShoppingBag",
  }),
  bloc("footer-atouts", "groupes", 2, {
    title: "Menus de groupe",
    body: "Plateaux à partager et devis personnalisé pour vos événements.",
    href: "/sur-mesure",
    icon: "UsersRound",
  }),
  bloc("footer-atouts", "traiteur", 3, {
    title: "Service traiteur",
    body: "Buffets et plateaux africains pour tous vos événements.",
    href: "/traiteur",
    icon: "ChefHat",
  }),

  // ── Pages légales ──────────────────────────────────────────────────────────
  // `body` vide = le texte modèle livré avec le site reste affiché
  // (voir src/components/LegalContent.tsx). Dès que le restaurateur rédige sa
  // version dans /admin/contenus, elle remplace intégralement le modèle.
  bloc("page-cgv", "contenu", 1, {
    title: "Conditions générales de vente",
  }),
  bloc("page-mentions-legales", "contenu", 1, {
    title: "Mentions légales",
  }),
  bloc("page-confidentialite", "contenu", 1, {
    title: "Politique de confidentialité",
  }),
];
