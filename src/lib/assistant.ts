import "server-only";
import { prisma } from "@/lib/prisma";
import { getMenuForBrowser } from "@/lib/dishes";
import { getOrderByReference } from "@/lib/orders";
import { getSiteConfig } from "@/lib/site-settings";

const DAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

// Pages internes que l'agent peut proposer d'ouvrir (whitelist → sécurité).
const PAGES: Record<string, { href: string; label: string }> = {
  reservation: { href: "/reservation", label: "Réserver une table" },
  commander: { href: "/commander", label: "Finaliser ma commande" },
  traiteur: { href: "/traiteur", label: "Demande traiteur / devis" },
  menu: { href: "/menu", label: "Voir le menu" },
  contact: { href: "/contact", label: "Nous contacter" },
};

export interface AssistantDish {
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  hasOptions: boolean;
  available: boolean;
  category: string;
}

/** Action validée renvoyée au client (le serveur garantit prix/nom réels). */
export type ResolvedAction =
  | {
      type: "add_to_cart";
      dishId: string;
      name: string;
      image: string;
      basePrice: number;
      quantity: number;
    }
  | { type: "link"; label: string; href: string };

type AssistantFallbackResult = {
  reply: string;
  actions: ResolvedAction[];
};

type DeliveryRule = {
  postalCode: string;
  fee: number;
  minOrder: number;
};

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}

// Champs autorisés pour préremplir le formulaire de réservation via l'URL.
const RESERVATION_FIELDS = [
  "name",
  "phone",
  "email",
  "date",
  "time",
  "guests",
  "notes",
];

function buildReservationHref(prefill: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const key of RESERVATION_FIELDS) {
    const value = prefill[key];
    if (value === undefined || value === null) continue;
    const str = String(value).trim().slice(0, 120);
    if (str) params.set(key, str);
  }
  const qs = params.toString();
  return qs ? `/reservation?${qs}` : "/reservation";
}

/**
 * Détecte une référence de commande (NK-…) dans le texte et récupère son
 * statut pour que l'agent puisse renseigner le client (suivi de commande).
 */
export async function lookupOrderContext(
  text: string,
): Promise<{ reference: string; summary: string; found: boolean } | null> {
  const match = text.match(/NK-[A-Z0-9]{4,}/i);
  if (!match) return null;
  const reference = match[0].toUpperCase();

  const order = await getOrderByReference(reference).catch(() => undefined);
  if (!order) {
    return {
      reference,
      found: false,
      summary: `Aucune commande trouvée pour la référence ${reference}. Vérifie la référence ou invite le client à utiliser le lien reçu par email.`,
    };
  }

  const eta = order.scheduledAt
    ? new Date(order.scheduledAt).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : `environ ${order.prepTimeMin} min après confirmation`;

  return {
    reference,
    found: true,
    summary: `Commande ${order.reference} : statut « ${order.status} », mode ${order.fulfillment}, ${order.items.length} article(s), total ${order.total.toFixed(2)} €, échéance prévue : ${eta}.`,
  };
}

/** Menu réel (produits disponibles) servant à la fois au prompt et à la validation des actions. */
export async function getAssistantMenu(): Promise<AssistantDish[]> {
  try {
    const { categories, dishes } = await getMenuForBrowser();
    const catName = new Map(categories.map((c) => [c.id, c.name]));
    return dishes
      .filter((d) => d.available)
      .map((d) => ({
        slug: d.id,
        name: d.name,
        description: d.description,
        price: d.price,
        image: d.image,
        hasOptions: d.hasOptions,
        available: d.available,
        category: catName.get(d.categoryId) ?? "Autres",
      }));
  } catch {
    return [];
  }
}

async function getHoursText(): Promise<string> {
  const hours = await prisma.openingHour
    .findMany({ orderBy: { dayOfWeek: "asc" } })
    .catch(() => []);
  if (!hours.length) {
    const siteConfig = await getSiteConfig();
    return `Horaires indicatifs : ${siteConfig.hours.summary}.`;
  }
  return hours
    .map((h) =>
      h.closed
        ? `- ${DAYS[h.dayOfWeek] ?? `Jour ${h.dayOfWeek}`} : fermé`
        : `- ${DAYS[h.dayOfWeek] ?? `Jour ${h.dayOfWeek}`} : ${formatMinutes(h.openMinutes)} – ${formatMinutes(h.closeMinutes)}`,
    )
    .join("\n");
}

async function getDeliveryRules(): Promise<DeliveryRule[]> {
  return prisma.deliveryZone
    .findMany({ orderBy: { postalCode: "asc" } })
    .catch(() => []);
}

function deliveryTextFromRules(zones: DeliveryRule[]): string {
  if (!zones.length)
    return "Zones de livraison non configurées ; invite à vérifier le code postal lors de la commande.";
  return zones
    .map(
      (z) =>
        `- ${z.postalCode} : frais ${z.fee.toFixed(2)} €, minimum de commande ${z.minOrder.toFixed(2)} €`,
    )
    .join("\n");
}

async function getDeliveryText(): Promise<string> {
  return deliveryTextFromRules(await getDeliveryRules());
}

/**
 * Construit le prompt système : rôle, données réelles (menu par catégories,
 * horaires, zones de livraison) et contrat JSON pour les actions.
 */
export async function buildSystemPrompt(
  menu: AssistantDish[],
  extraContext?: string,
): Promise<string> {
  const [hoursText, deliveryText, siteConfig] = await Promise.all([
    getHoursText(),
    getDeliveryText(),
    getSiteConfig(),
  ]);

  // Menu groupé par catégorie (pour suggérer une sélection cohérente).
  let menuText =
    "Menu indisponible ; invite l'utilisateur à consulter la page Menu.";
  if (menu.length) {
    const groups = new Map<string, AssistantDish[]>();
    for (const d of menu) {
      const list = groups.get(d.category) ?? [];
      list.push(d);
      groups.set(d.category, list);
    }
    menuText = [...groups.entries()]
      .map(
        ([cat, dishes]) =>
          `### ${cat}\n` +
          dishes
            .map(
              (d) =>
                `- [${d.slug}] ${d.name} — ${d.price.toFixed(2)} €${d.hasOptions ? " (options à choisir)" : ""}${d.description ? ` : ${d.description}` : ""}`,
            )
            .join("\n"),
      )
      .join("\n\n");
  }

  const now = new Date();
  const currentParisDate = now.toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });

  return `Tu es l'assistant virtuel de « ${siteConfig.name} », restaurant de spécialités africaines proposant thiéboudiène, yassa, mafé, attiéké, alloco, grillades, desserts et boissons maison, situé au ${siteConfig.contact.address}. Tu réponds en JSON.

TON RÔLE :
- Aider chaleureusement les clients en français, de façon concise et naturelle.
- Conseiller plats africains, grillades, accompagnements, desserts et boissons maison, composer un repas cohérent (entrée, plat, dessert, boisson) et ajouter les produits au panier.
- Renseigner sur les horaires, la livraison (codes postaux desservis), les réservations de table et le service traiteur.
- Répondre aux questions courantes sur l'adresse, le téléphone, l'email, les commandes à emporter, le click & collect, le paiement, les allergies et le suivi de commande.
- Quand c'est utile, proposer d'ouvrir une page (réservation, commander, traiteur…) via une action.

FORMAT DE RÉPONSE (JSON strict, rien d'autre) :
{
  "reply": "ta réponse en français (2 à 5 phrases max)",
  "actions": [
    { "type": "add_to_cart", "dishId": "<slug>", "quantity": <entier 1-10> },
    { "type": "open_page", "page": "reservation" | "commander" | "traiteur" | "menu" | "contact", "prefill": { "date": "AAAA-MM-JJ", "time": "HH:MM", "guests": "<nombre>", "name": "...", "phone": "...", "email": "..." } }
  ]
}
- "actions" est optionnel (tableau vide si aucune action). "prefill" est optionnel et ne s'applique qu'à "reservation".
- add_to_cart : QUE des produits du menu ci-dessous. Le "dishId" est le slug entre crochets SANS les crochets (ex : "[thieb-poisson]" → "thieb-poisson").
- Dès que le client veut un produit (ou que tu proposes une sélection), émets une action add_to_cart pour CHAQUE produit — MÊME s'il est "(options à choisir)" : le site affichera alors un lien vers sa page au lieu de l'ajouter directement.
- Pour un repas complet (entrée, plat, dessert, boisson), propose des produits cohérents et ajoute-les tous.
- open_page : réserver une table → "reservation" ; finaliser la commande → "commander" ; un événement → "traiteur".
- RÉSERVATION : si le client donne des détails (date, heure, nombre de personnes…), émets open_page "reservation" avec un objet "prefill" rempli (date au format AAAA-MM-JJ, heure HH:MM, guests = nombre) pour préremplir le formulaire. Ne demande pas une info déjà donnée.
- BUDGET : si le client donne un budget (ex : « pour 25 € »), propose une sélection dont le TOTAL reste sous ce budget, indique le total calculé dans "reply", et ajoute les produits via add_to_cart.
- Dans "reply", mentionne ce que tu ajoutes (ex : « J'ai ajouté le thiéboudiène poisson à votre panier. »). Pour un produit à options, invite à choisir les options via le lien.

LIVRAISON :
- Codes postaux desservis et conditions :
${deliveryText}
- Si le client donne un code postal de cette liste, confirme les frais et le minimum. Sinon, indique que la zone n'est pas desservie et propose le retrait sur place.

RÈGLES :
- Date et heure actuelles à Paris : ${currentParisDate}. Utilise cette date pour interpréter "aujourd'hui", "demain" ou "ce soir".
- N'invente jamais un produit, un slug, un prix, un horaire ou une zone de livraison.
- Si tu ne sais pas, invite à appeler le ${siteConfig.contact.phone} ou via la page Contact.
- Allergènes / régimes (halal, végétarien…) : recommande de préciser dans les notes de commande et de confirmer par téléphone.
- Hors sujet restaurant : réponds brièvement puis recentre vers le menu, la réservation, la livraison ou le contact.

COORDONNÉES : Tél ${siteConfig.contact.phone} · ${siteConfig.contact.address} · ${siteConfig.contact.email}

HORAIRES :
${hoursText}

MENU ACTUEL :
${menuText}${extraContext ? `\n\nSUIVI DE COMMANDE (info récupérée pour la demande en cours) :\n${extraContext}` : ""}`;
}

/**
 * Valide et résout les actions proposées par le LLM.
 * Garantit que prix/nom proviennent de la DB et que les pages sont whitelistées.
 */
export function resolveActions(
  rawActions: unknown,
  menu: AssistantDish[],
): ResolvedAction[] {
  if (!Array.isArray(rawActions)) return [];
  const bySlug = new Map(menu.map((d) => [d.slug, d]));
  const resolved: ResolvedAction[] = [];
  const seen = new Set<string>();

  for (const raw of rawActions.slice(0, 8)) {
    if (!raw || typeof raw !== "object") continue;
    const a = raw as Record<string, unknown>;

    if (a.type === "open_page" && typeof a.page === "string") {
      const pageKey = a.page.toLowerCase();
      const page = PAGES[pageKey];
      if (page && !seen.has(`page:${pageKey}`)) {
        seen.add(`page:${pageKey}`);
        const href =
          pageKey === "reservation" &&
          a.prefill &&
          typeof a.prefill === "object"
            ? buildReservationHref(a.prefill as Record<string, unknown>)
            : page.href;
        resolved.push({ type: "link", label: page.label, href });
      }
      continue;
    }

    if (a.type !== "add_to_cart" || typeof a.dishId !== "string") continue;

    // Le LLM inclut parfois les crochets/espaces du menu ([slug]) → on nettoie.
    const slug = a.dishId.replace(/[[\]\s]/g, "").toLowerCase();
    const dish = bySlug.get(slug);
    if (!dish || seen.has(`dish:${slug}`)) continue;
    seen.add(`dish:${slug}`);

    // Plat à options → on ne devine pas : on renvoie un lien vers sa page.
    if (dish.hasOptions) {
      resolved.push({
        type: "link",
        label: `Choisir les options · ${dish.name}`,
        href: `/menu/${dish.slug}`,
      });
      continue;
    }

    const qty = Math.min(10, Math.max(1, Math.round(Number(a.quantity) || 1)));
    resolved.push({
      type: "add_to_cart",
      dishId: dish.slug,
      name: dish.name,
      image: dish.image,
      basePrice: dish.price,
      quantity: qty,
    });
  }
  return resolved;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

const STOP_WORDS = new Set([
  "avec",
  "avez",
  "bonjour",
  "combien",
  "dans",
  "des",
  "est",
  "etes",
  "faites",
  "faire",
  "menu",
  "pour",
  "prix",
  "quoi",
  "restaurant",
  "site",
  "une",
  "vous",
  "votre",
]);

function hasAny(q: string, terms: string[]): boolean {
  return terms.some((term) => q.includes(term));
}

function formatPrice(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function compactLines(value: string): string {
  return value.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

function extractQuantity(q: string): number {
  const numeric = q.match(/\b([1-9]|10)\b/);
  if (numeric) return Math.min(10, Math.max(1, Number(numeric[1])));

  const words: Record<string, number> = {
    un: 1,
    une: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5,
  };
  for (const [word, quantity] of Object.entries(words)) {
    if (new RegExp(`\\b${word}\\b`).test(q)) return quantity;
  }
  return 1;
}

function wantsCartAction(q: string): boolean {
  return hasAny(q, [
    "ajoute",
    "ajouter",
    "commande",
    "commander",
    "je veux",
    "mets",
    "mettre",
    "panier",
    "prendre",
    "prends",
  ]);
}

function dishAction(dish: AssistantDish, quantity = 1): ResolvedAction {
  if (dish.hasOptions) {
    return {
      type: "link",
      label: `Choisir les options · ${dish.name}`,
      href: `/menu/${dish.slug}`,
    };
  }

  return {
    type: "add_to_cart",
    dishId: dish.slug,
    name: dish.name,
    image: dish.image,
    basePrice: dish.price,
    quantity,
  };
}

function formatDishes(dishes: AssistantDish[]): string {
  return dishes
    .slice(0, 5)
    .map((dish) => `${dish.name} (${formatPrice(dish.price)})`)
    .join(", ");
}

function findMatchingDishes(
  input: string,
  menu: AssistantDish[],
): AssistantDish[] {
  const q = normalize(input);
  const tokens = q
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

  const categoryTerms: Array<[string[], string[]]> = [
    [
      ["dessert", "sucre", "douceur"],
      ["dessert", "douceur"],
    ],
    [
      ["boisson", "bissap", "gingembre", "bouye"],
      ["boisson", "bissap", "gingembre", "bouye"],
    ],
    [
      ["entree", "pastel", "alloco"],
      ["entree", "pastel", "alloco"],
    ],
    [
      ["grillade", "poulet", "poisson", "braise"],
      ["grillade", "poulet", "poisson", "braise"],
    ],
    [
      ["thieb", "yassa", "mafe", "attieke"],
      ["thieb", "yassa", "mafe", "attieke"],
    ],
  ];

  const scored = menu
    .map((dish) => {
      const haystack = normalize(
        `${dish.name} ${dish.slug} ${dish.category} ${dish.description}`,
      );
      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score += 2;
      }
      for (const [questionTerms, dishTerms] of categoryTerms) {
        if (
          questionTerms.some((term) => q.includes(term)) &&
          dishTerms.some((term) => haystack.includes(term))
        ) {
          score += 3;
        }
      }
      return { dish, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.dish.price - b.dish.price);

  return scored.map((item) => item.dish);
}

function pickSuggestion(menu: AssistantDish[], q: string): AssistantDish[] {
  const byText = (terms: string[]) =>
    menu.find((dish) =>
      terms.some((term) =>
        normalize(`${dish.name} ${dish.category} ${dish.description}`).includes(
          term,
        ),
      ),
    );

  if (hasAny(q, ["vegetarien", "veggie", "sans viande"])) {
    return [byText(["alloco", "salade", "vegetarien"]), byText(["bissap"])]
      .filter(Boolean)
      .slice(0, 3) as AssistantDish[];
  }

  return [
    byText(["pastel", "alloco", "entree"]),
    byText(["thieb", "yassa", "mafe", "attieke"]),
    byText(["douceur", "dessert"]),
    byText(["bissap", "gingembre", "bouye", "boisson"]),
  ]
    .filter(Boolean)
    .slice(0, 4) as AssistantDish[];
}

function actionsWithoutDuplicates(actions: ResolvedAction[]): ResolvedAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key =
      action.type === "add_to_cart"
        ? `cart:${action.dishId}`
        : `link:${action.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Réponse enrichie de secours : utilisée quand aucun fournisseur LLM n'est
 * configuré. Elle exploite tout de même les données réelles du site.
 */
export async function ruleBasedResponse(
  input: string,
  menu: AssistantDish[] = [],
  orderContext?: Awaited<ReturnType<typeof lookupOrderContext>>,
): Promise<AssistantFallbackResult> {
  const q = normalize(input);
  const [hoursText, deliveryRules, siteConfig] = await Promise.all([
    getHoursText(),
    getDeliveryRules(),
    getSiteConfig(),
  ]);

  const actions: ResolvedAction[] = [];

  if (orderContext) {
    if (orderContext.found) {
      actions.push({
        type: "link",
        label: `Voir ma commande ${orderContext.reference}`,
        href: `/commande/${orderContext.reference}`,
      });
    }
    return { reply: orderContext.summary, actions };
  }

  if (!q.trim()) {
    return {
      reply:
        "Bonjour, je peux vous aider pour le menu, les prix, la livraison, une réservation, une commande ou un événement traiteur.",
      actions: [{ type: "link", label: "Voir le menu", href: "/menu" }],
    };
  }

  if (hasAny(q, ["telephone", "tel", "appeler", "contact", "email", "mail"])) {
    actions.push({ type: "link", label: "Nous contacter", href: "/contact" });
    return {
      reply: `Vous pouvez joindre ${siteConfig.name} au ${siteConfig.contact.phone}, par email à ${siteConfig.contact.email}, ou venir au ${siteConfig.contact.address}.`,
      actions,
    };
  }

  if (hasAny(q, ["adresse", "situe", "trouver", "ou etes", "venir"])) {
    actions.push({ type: "link", label: "Nous contacter", href: "/contact" });
    return {
      reply: `${siteConfig.name} se trouve au ${siteConfig.contact.address}. Vous pouvez commander à emporter, réserver une table ou vérifier la livraison selon votre code postal.`,
      actions,
    };
  }

  if (hasAny(q, ["horaire", "ouvert", "ouvre", "ferme", "fermeture"])) {
    return {
      reply: `Les horaires affichés du restaurant sont : ${compactLines(hoursText)}.`,
      actions: [
        { type: "link", label: "Réserver une table", href: "/reservation" },
      ],
    };
  }

  if (
    hasAny(q, [
      "livraison",
      "livre",
      "livrer",
      "livrez",
      "adresse",
      "code postal",
      "domicile",
    ]) ||
    /\b\d{5}\b/.test(q)
  ) {
    const postalCode = q.match(/\b\d{5}\b/)?.[0];
    const zone = postalCode
      ? deliveryRules.find((item) => item.postalCode === postalCode)
      : undefined;
    actions.push({
      type: "link",
      label: "Finaliser ma commande",
      href: "/commander",
    });

    if (zone) {
      return {
        reply: `Oui, nous livrons le ${zone.postalCode}. Frais de livraison : ${formatPrice(zone.fee)} ; minimum de commande : ${formatPrice(zone.minOrder)}.`,
        actions,
      };
    }

    return {
      reply: `La livraison couvre les zones configurées suivantes : ${deliveryTextFromRules(deliveryRules).replace(/\n/g, " ")}. Si votre code postal n'est pas listé, choisissez le retrait sur place ou contactez-nous.`,
      actions,
    };
  }

  if (hasAny(q, ["reservation", "reserver", "table", "sur place"])) {
    return {
      reply:
        "Pour une table, ouvrez la réservation puis indiquez la date, l'heure, le nombre de personnes et vos coordonnées. Pour une demande urgente, appelez directement le restaurant.",
      actions: [
        { type: "link", label: "Réserver une table", href: "/reservation" },
      ],
    };
  }

  if (
    hasAny(q, [
      "traiteur",
      "evenement",
      "groupe",
      "anniversaire",
      "devis",
      "mariage",
    ])
  ) {
    return {
      reply:
        "Pour un groupe ou un événement, envoyez une demande traiteur avec la date, le nombre d'invités et vos besoins. L'équipe vous répondra avec une proposition adaptée.",
      actions: [
        { type: "link", label: "Demande traiteur / devis", href: "/traiteur" },
      ],
    };
  }

  if (
    hasAny(q, ["allerg", "halal", "vegetarien", "vegan", "sans gluten", "porc"])
  ) {
    const suggestions = findMatchingDishes(input, menu).slice(0, 3);
    return {
      reply: suggestions.length
        ? `Pour les régimes ou allergènes, précisez toujours la contrainte dans les notes et confirmez par téléphone. Côté menu, vous pouvez regarder : ${formatDishes(suggestions)}.`
        : "Pour les régimes ou allergènes, précisez toujours la contrainte dans les notes de commande et confirmez par téléphone avant de valider.",
      actions: [{ type: "link", label: "Voir le menu", href: "/menu" }],
    };
  }

  if (hasAny(q, ["paiement", "payer", "cb", "carte", "especes", "ticket"])) {
    return {
      reply:
        "La commande se finalise depuis la page Commander. Si un moyen de paiement précis n'est pas proposé au moment de valider, contactez le restaurant pour confirmer la solution possible.",
      actions: [
        {
          type: "link",
          label: "Finaliser ma commande",
          href: "/commander",
        },
      ],
    };
  }

  if (hasAny(q, ["whatsapp", "telegram"])) {
    return {
      reply:
        "Après avoir ajouté vos produits au panier, vous pouvez utiliser les boutons WhatsApp ou Telegram dans le récapitulatif si vous souhaitez envoyer la commande par message.",
      actions: [
        {
          type: "link",
          label: "Finaliser ma commande",
          href: "/commander",
        },
      ],
    };
  }

  const matchedDishes = findMatchingDishes(input, menu);
  if (
    matchedDishes.length &&
    (wantsCartAction(q) ||
      hasAny(q, ["menu", "plat", "prix", "thieb", "yassa", "mafe", "attieke"]))
  ) {
    const quantity = extractQuantity(q);
    const selected = matchedDishes.slice(0, wantsCartAction(q) ? 3 : 5);
    const actionList = wantsCartAction(q)
      ? selected.slice(0, 3).map((dish) => dishAction(dish, quantity))
      : [{ type: "link" as const, label: "Voir le menu", href: "/menu" }];
    return {
      reply: wantsCartAction(q)
        ? `J'ai préparé la sélection demandée : ${formatDishes(selected)}. Les produits avec options doivent être confirmés depuis leur fiche.`
        : `Voici ce que j'ai trouvé au menu : ${formatDishes(selected)}. Les prix et disponibilités viennent du menu actuel.`,
      actions: actionsWithoutDuplicates(actionList),
    };
  }

  if (
    hasAny(q, [
      "conseille",
      "conseil",
      "recommande",
      "suggestion",
      "quoi prendre",
      "repas",
    ])
  ) {
    const suggestions = pickSuggestion(menu, q);
    if (suggestions.length) {
      const total = suggestions.reduce((sum, dish) => sum + dish.price, 0);
      return {
        reply: `Je vous conseille : ${formatDishes(suggestions)}. Total indicatif : ${formatPrice(total)} avant options éventuelles.`,
        actions: actionsWithoutDuplicates(
          suggestions.slice(0, 4).map((dish) => dishAction(dish)),
        ),
      };
    }
  }

  if (hasAny(q, ["menu", "carte", "plat", "prix", "thieb", "yassa", "mafe"])) {
    return {
      reply:
        "La carte en ligne affiche les plats disponibles, les prix, les options et l'ajout au panier. Je peux aussi vous conseiller si vous me dites ce que vous aimez.",
      actions: [{ type: "link", label: "Voir le menu", href: "/menu" }],
    };
  }

  return {
    reply:
      "Je peux vous aider sur le menu, les prix, les horaires, la livraison, une réservation, une commande ou un devis traiteur. Pour une demande spéciale, utilisez la page Contact.",
    actions: [
      { type: "link", label: "Voir le menu", href: "/menu" },
      { type: "link", label: "Nous contacter", href: "/contact" },
    ],
  };
}
