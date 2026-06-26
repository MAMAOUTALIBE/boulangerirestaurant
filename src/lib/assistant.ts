import "server-only";
import { prisma } from "@/lib/prisma";
import { getMenuForBrowser } from "@/lib/dishes";
import { getOrderByReference } from "@/lib/orders";
import { siteConfig } from "@/lib/config";

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
  if (!hours.length)
    return "Horaires indicatifs : tous les jours de 7h00 à 19h30.";
  return hours
    .map((h) =>
      h.closed
        ? `- ${DAYS[h.dayOfWeek] ?? `Jour ${h.dayOfWeek}`} : fermé`
        : `- ${DAYS[h.dayOfWeek] ?? `Jour ${h.dayOfWeek}`} : ${formatMinutes(h.openMinutes)} – ${formatMinutes(h.closeMinutes)}`,
    )
    .join("\n");
}

async function getDeliveryText(): Promise<string> {
  const zones = await prisma.deliveryZone
    .findMany({ orderBy: { postalCode: "asc" } })
    .catch(() => []);
  if (!zones.length)
    return "Zones de livraison non configurées ; invite à vérifier le code postal lors de la commande.";
  return zones
    .map(
      (z) =>
        `- ${z.postalCode} : frais ${z.fee.toFixed(2)} €, minimum de commande ${z.minOrder.toFixed(2)} €`,
    )
    .join("\n");
}

/**
 * Construit le prompt système : rôle, données réelles (menu par catégories,
 * horaires, zones de livraison) et contrat JSON pour les actions.
 */
export async function buildSystemPrompt(
  menu: AssistantDish[],
  extraContext?: string,
): Promise<string> {
  const [hoursText, deliveryText] = await Promise.all([
    getHoursText(),
    getDeliveryText(),
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

  return `Tu es l'assistant virtuel de « ${siteConfig.name} », restaurant turc spécialisé dans les grillades au charbon, kebabs, pide, lahmacun, mezze et desserts orientaux, situé au ${siteConfig.contact.address}. Tu réponds en JSON.

TON RÔLE :
- Aider chaleureusement les clients en français, de façon concise et naturelle.
- Conseiller grillades, kebabs, pide, lahmacun, mezze et desserts turcs, composer un repas cohérent (entrée, plat, dessert, boisson) et ajouter les produits au panier.
- Renseigner sur les horaires, la livraison (codes postaux desservis), les réservations de table et le service traiteur.
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
- add_to_cart : QUE des produits du menu ci-dessous. Le "dishId" est le slug entre crochets SANS les crochets (ex : "[adana-kebab]" → "adana-kebab").
- Dès que le client veut un produit (ou que tu proposes une sélection), émets une action add_to_cart pour CHAQUE produit — MÊME s'il est "(options à choisir)" : le site affichera alors un lien vers sa page au lieu de l'ajouter directement.
- Pour un repas complet (entrée, plat, dessert, boisson), propose des produits cohérents et ajoute-les tous.
- open_page : réserver une table → "reservation" ; finaliser la commande → "commander" ; un événement → "traiteur".
- RÉSERVATION : si le client donne des détails (date, heure, nombre de personnes…), émets open_page "reservation" avec un objet "prefill" rempli (date au format AAAA-MM-JJ, heure HH:MM, guests = nombre) pour préremplir le formulaire. Ne demande pas une info déjà donnée.
- BUDGET : si le client donne un budget (ex : « pour 25 € »), propose une sélection dont le TOTAL reste sous ce budget, indique le total calculé dans "reply", et ajoute les produits via add_to_cart.
- Dans "reply", mentionne ce que tu ajoutes (ex : « J'ai ajouté l'adana kebab à votre panier. »). Pour un produit à options, invite à choisir les options via le lien.

LIVRAISON :
- Codes postaux desservis et conditions :
${deliveryText}
- Si le client donne un code postal de cette liste, confirme les frais et le minimum. Sinon, indique que la zone n'est pas desservie et propose le retrait sur place.

RÈGLES :
- N'invente jamais un produit, un slug, un prix, un horaire ou une zone de livraison.
- Si tu ne sais pas, invite à appeler le ${siteConfig.contact.phone} ou via la page Contact.
- Allergènes / régimes (halal, végétarien…) : recommande de préciser dans les notes de commande et de confirmer par téléphone.

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

/**
 * Réponse de secours par règles (mots-clés) : utilisée quand aucune clé LLM
 * n'est configurée ou si l'appel au modèle échoue.
 */
export function ruleBasedAnswer(input: string): string {
  const q = normalize(input);

  if (q.includes("whatsapp") || q.includes("telegram")) {
    return "Ajoutez vos produits au panier, choisissez le créneau, puis utilisez les boutons WhatsApp ou Telegram dans le récapitulatif de commande.";
  }
  if (
    q.includes("livraison") ||
    q.includes("adresse") ||
    q.includes("code postal")
  ) {
    return "La livraison est prévue autour de Juvisy-sur-Orge (codes postaux 91260, 91200, 91600). Le site vérifie le code postal et le minimum de commande avant validation.";
  }
  if (
    q.includes("reservation") ||
    q.includes("table") ||
    q.includes("sur place")
  ) {
    return "Pour manger sur place, utilisez la page Réservation : vous choisissez la date, l'heure, le nombre de personnes et vos coordonnées.";
  }
  if (
    q.includes("traiteur") ||
    q.includes("evenement") ||
    q.includes("devis")
  ) {
    return "Pour un événement, la page Traiteur permet d'envoyer une demande de devis avec le nombre d'invités, la date et le message.";
  }
  if (q.includes("allerg") || q.includes("halal") || q.includes("vegetar")) {
    return "Indiquez vos contraintes dans les notes de commande. Pour les allergènes, appelez le restaurant avant de valider.";
  }
  if (
    q.includes("menu") ||
    q.includes("produit") ||
    q.includes("kebab") ||
    q.includes("grillade") ||
    q.includes("prix")
  ) {
    return "Le menu contient les produits disponibles avec prix, options et ajout au panier. Rendez-vous sur la page Menu.";
  }
  if (q.includes("paiement") || q.includes("payer") || q.includes("stripe")) {
    return "La commande se valide d'abord, puis le paiement se fait à l'étape suivante. En production, Stripe gère le paiement réel.";
  }
  if (q.includes("horaire") || q.includes("ouvert")) {
    return "Le service est prévu de 7h à 19h30. Les créneaux disponibles sont proposés automatiquement pendant la commande.";
  }
  return "Le plus rapide est de choisir Menu, ajouter vos produits au panier, puis finaliser sur Commander. Pour une demande spéciale, utilisez Contact.";
}
