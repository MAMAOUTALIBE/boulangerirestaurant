/**
 * Agrégation « Qui teste le site » — regroupe par personne toutes les traces
 * laissées sur le site (leads de démo, paniers non finalisés, commandes de tous
 * statuts) pour identifier qui teste et jusqu'où il est allé.
 *
 * Pur / framework-free (pas de `server-only`, pas de Prisma) → testable
 * isolément. La lecture en base vit dans `src/lib/testers.ts`.
 */

export type TesterStage = "contact" | "panier" | "commande";

export type ActivityKind = "lead" | "panier" | "commande";

export const TESTER_STAGES: TesterStage[] = ["contact", "panier", "commande"];

export const STAGE_LABELS: Record<TesterStage, string> = {
  contact: "Contact",
  panier: "Panier abandonné",
  commande: "A commandé",
};

export interface TesterActivity {
  kind: ActivityKind;
  /** Identifiant lisible (référence commande, cartId, source…). */
  ref: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  /** Libellé de canal affiché (source du lead, mode de commande…). */
  channel: string;
  /** Statut brut éventuel (statut de commande, statut de panier…). */
  status?: string | null;
  total?: number | null;
  detail?: string | null;
  /** Horodatage en millisecondes. */
  at: number;
  /** Nombre de passages connus (défaut 1). */
  visits?: number;
}

export interface TesterCounts {
  leads: number;
  carts: number;
  orders: number;
  ordersPaid: number;
  ordersPending: number;
  ordersCanceled: number;
}

export interface TesterProfile {
  /** Clé de regroupement stable (email, téléphone ou panier anonyme). */
  key: string;
  name?: string;
  email?: string;
  phone?: string;
  anonymous: boolean;
  firstAt: number;
  lastAt: number;
  visits: number;
  channels: string[];
  stage: TesterStage;
  counts: TesterCounts;
  totalOrdered: number;
  lastStatus?: string;
  /** Activités du profil, de la plus récente à la plus ancienne. */
  activities: TesterActivity[];
}

/** Arrondi monétaire (centimes) — évite la dérive des flottants. */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeEmail(value?: string | null): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || undefined;
}

export function normalizePhone(value?: string | null): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/[^\d+]/g, "");
  // En dessous de 6 chiffres, trop court pour identifier de façon fiable.
  return digits.replace(/\D/g, "").length >= 6 ? digits : undefined;
}

/** Union-find minimal pour relier les identifiants (email ⇔ téléphone). */
class UnionFind {
  private parent = new Map<string, string>();

  find(x: string): string {
    const current = this.parent.get(x);
    if (current === undefined) {
      this.parent.set(x, x);
      return x;
    }
    if (current === x) return x;
    const root = this.find(current);
    this.parent.set(x, root);
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

function buildProfile(key: string, list: TesterActivity[]): TesterProfile {
  // Du plus récent au plus ancien : la 1re valeur non vide fait foi.
  const sorted = [...list].sort((a, b) => b.at - a.at);

  let name: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;
  const channels: string[] = [];
  const counts: TesterCounts = {
    leads: 0,
    carts: 0,
    orders: 0,
    ordersPaid: 0,
    ordersPending: 0,
    ordersCanceled: 0,
  };
  let visits = 0;
  let totalOrdered = 0;
  let firstAt = Infinity;
  let lastAt = -Infinity;
  let lastStatus: string | undefined;

  for (const a of sorted) {
    if (!name) name = a.name?.trim() || undefined;
    if (!email) email = normalizeEmail(a.email);
    if (!phone) phone = normalizePhone(a.phone);
    if (!channels.includes(a.channel)) channels.push(a.channel);
    visits += a.visits ?? 1;
    firstAt = Math.min(firstAt, a.at);
    lastAt = Math.max(lastAt, a.at);

    if (a.kind === "lead") {
      counts.leads += 1;
    } else if (a.kind === "panier") {
      counts.carts += 1;
    } else {
      counts.orders += 1;
      if (a.status === "annulée") counts.ordersCanceled += 1;
      else if (a.status === "en attente") counts.ordersPending += 1;
      else counts.ordersPaid += 1;
      if (a.status !== "annulée") totalOrdered += a.total ?? 0;
      // sorted est décroissant : la 1re commande rencontrée est la + récente.
      if (!lastStatus) lastStatus = a.status ?? undefined;
    }
  }

  const stage: TesterStage =
    counts.orders > 0 ? "commande" : counts.carts > 0 ? "panier" : "contact";

  return {
    key,
    name,
    email,
    phone,
    anonymous: !email && !phone,
    firstAt,
    lastAt,
    visits,
    channels,
    stage,
    counts,
    totalOrdered: roundCurrency(totalOrdered),
    lastStatus,
    activities: sorted,
  };
}

/**
 * Regroupe des activités hétérogènes par personne (fusion transitive
 * email ⇔ téléphone). Les traces sans coordonnées (panier anonyme) restent
 * isolées sous leur `cartId`. Retour trié du plus récent au plus ancien.
 */
export function aggregateTesters(
  activities: TesterActivity[],
): TesterProfile[] {
  const uf = new UnionFind();

  // Passe 1 : relie l'email et le téléphone apparus sur une même trace.
  for (const a of activities) {
    const email = normalizeEmail(a.email);
    const phone = normalizePhone(a.phone);
    const emailId = email ? `e:${email}` : undefined;
    const phoneId = phone ? `p:${phone}` : undefined;
    if (emailId) uf.find(emailId);
    if (phoneId) uf.find(phoneId);
    if (emailId && phoneId) uf.union(emailId, phoneId);
  }

  // Passe 2 : range chaque activité dans son groupe résolu.
  const groups = new Map<string, TesterActivity[]>();
  activities.forEach((a, index) => {
    const email = normalizeEmail(a.email);
    const phone = normalizePhone(a.phone);
    const emailId = email ? `e:${email}` : undefined;
    const phoneId = phone ? `p:${phone}` : undefined;
    const groupKey = emailId
      ? uf.find(emailId)
      : phoneId
        ? uf.find(phoneId)
        : a.kind === "panier"
          ? `c:${a.ref}`
          : `x:${index}`;
    const existing = groups.get(groupKey);
    if (existing) existing.push(a);
    else groups.set(groupKey, [a]);
  });

  const profiles: TesterProfile[] = [];
  for (const [groupKey, list] of groups) {
    profiles.push(buildProfile(groupKey, list));
  }
  profiles.sort((a, b) => b.lastAt - a.lastAt);
  return profiles;
}

/** Filtre une liste de profils par étape atteinte et recherche plein texte. */
export function filterTesters(
  profiles: TesterProfile[],
  filters?: { q?: string; stage?: string },
): TesterProfile[] {
  const q = filters?.q?.trim().toLowerCase();
  const stage =
    filters?.stage && TESTER_STAGES.includes(filters.stage as TesterStage)
      ? (filters.stage as TesterStage)
      : undefined;

  return profiles.filter((p) => {
    if (stage && p.stage !== stage) return false;
    if (!q) return true;
    const haystack = [
      p.name,
      p.email,
      p.phone,
      ...p.channels,
      ...p.activities.map((a) => a.ref),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
