export type Locale = "fr" | "en";

/** Dictionnaire des chaînes d'interface (chrome public). */
export const dict: Record<Locale, Record<string, string>> = {
  fr: {
    "nav./": "Accueil",
    "nav.#accueil": "Accueil",
    "nav.#a-propos": "À propos",
    "nav./menu": "Menu",
    "nav./menu.desktop": "Notre carte",
    "nav./commander": "Commander",
    "nav./reservation": "Réservation",
    "nav.offers": "Nos offres",
    "nav./sur-mesure": "Sur-mesure",
    "nav./boutique-de-saison": "Boutique de saison",
    "nav./anti-gaspi": "Anti-gaspi",
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
    "nav./reservation": "Booking",
    "nav.offers": "Our offers",
    "nav./sur-mesure": "Tailor-made",
    "nav./boutique-de-saison": "Seasonal shop",
    "nav./anti-gaspi": "Anti-waste",
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
