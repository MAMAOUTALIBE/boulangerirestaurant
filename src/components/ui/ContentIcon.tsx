import { createElement } from "react";
import {
  CalendarCheck,
  ChefHat,
  Clock,
  CreditCard,
  Flame,
  Gift,
  Images,
  Leaf,
  Recycle,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { resolveIconName } from "@/lib/content-blocks";

/**
 * Icône d'un bloc de contenu.
 *
 * Le nom vient de la base (donc d'une saisie au CRM) : il est validé contre la
 * liste blanche de `content-blocks.ts` avant d'être résolu ici. Aucune
 * résolution dynamique arbitraire — la table ci-dessous est le seul chemin.
 */
const ICONES: Record<string, LucideIcon> = {
  ShoppingBag,
  CalendarCheck,
  UtensilsCrossed,
  ChefHat,
  UsersRound,
  Truck,
  CreditCard,
  ShieldCheck,
  Clock,
  Leaf,
  Flame,
  Gift,
  Recycle,
  Images,
  Star,
};

export function ContentIcon({
  name,
  className,
  fallback: Fallback,
}: {
  name?: string | null;
  className?: string;
  /** Icône utilisée si le bloc n'en précise pas (ou en précise une inconnue). */
  fallback?: LucideIcon;
}) {
  const valide = resolveIconName(name);
  const icone = (valide && ICONES[valide]) || Fallback;
  // `createElement` plutôt que du JSX à composant variable : on ne crée aucun
  // composant au rendu, on se contente de choisir dans la table ci-dessus.
  return icone
    ? createElement(icone, { className, "aria-hidden": true })
    : null;
}
