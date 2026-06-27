export type Locale = "fr" | "en";

/** Dictionnaire des chaînes d'interface (chrome public). */
export const dict: Record<Locale, Record<string, string>> = {
  fr: {
    "nav./": "Accueil",
    "nav.#accueil": "Accueil",
    "nav.#a-propos": "À propos",
    "nav./menu": "Menu",
    "nav./menu.desktop": "La carte",
    "nav./commander": "Commander",
    "nav./reservation": "Réserver",
    "nav.offers": "Groupes & événements",
    "nav./sur-mesure": "Menus de groupe",
    "nav./boutique-de-saison": "Précommandes",
    "nav./anti-gaspi": "Paniers du soir",
    "nav./traiteur": "Traiteur",
    "nav./contact": "Contact",
    "nav.#avis": "Avis",
    "nav./#avis-clients": "Avis",
    "nav.#contact": "Contact",
    "nav./#contact": "Contact",
    "cta.order": "Commander",
    "cta.viewMenu": "Voir le menu",
    "cta.account": "Mon compte",
    "cart.title": "Votre panier",
  },
  en: {
    "nav./": "Home",
    "nav.#accueil": "Home",
    "nav.#a-propos": "About",
    "nav./menu": "Menu",
    "nav./menu.desktop": "Our menu",
    "nav./commander": "Order",
    "nav./reservation": "Book",
    "nav.offers": "Groups & events",
    "nav./sur-mesure": "Group menus",
    "nav./boutique-de-saison": "Pre-orders",
    "nav./anti-gaspi": "Evening baskets",
    "nav./traiteur": "Catering",
    "nav./contact": "Contact",
    "nav.#avis": "Reviews",
    "nav./#avis-clients": "Reviews",
    "nav.#contact": "Contact",
    "nav./#contact": "Contact",
    "cta.order": "Order",
    "cta.viewMenu": "View menu",
    "cta.account": "My account",
    "cart.title": "Your cart",
  },
};

export function translate(
  locale: Locale,
  key: string,
  fallback?: string,
): string {
  return dict[locale]?.[key] ?? fallback ?? key;
}
