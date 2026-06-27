import { Leaf, ChefHat, Truck, ShieldCheck } from "lucide-react";
import type { Service, NavLink } from "@/types";

/** Badges de réassurance affichés sous le hero. */
export const services: Service[] = [
  { id: "frais", label: "Viandes fraîches marinées maison", icon: Leaf },
  { id: "prepare", label: "Grillé au charbon, à la commande", icon: ChefHat },
  { id: "livraison", label: "Livraison rapide à domicile", icon: Truck },
  { id: "paiement", label: "Paiement sécurisé en ligne", icon: ShieldCheck },
];

/** Liens de navigation principaux. */
export const navLinks: NavLink[] = [
  { label: "La carte", href: "/menu" },
  { label: "Commander", href: "/commander" },
  { label: "Réserver", href: "/reservation" },
  { label: "Menus de groupe", href: "/sur-mesure" },
  { label: "Précommandes", href: "/boutique-de-saison" },
  { label: "Paniers du soir", href: "/anti-gaspi" },
  { label: "Traiteur", href: "/traiteur" },
  { label: "Galerie", href: "/galerie" },
  { label: "Contact", href: "/contact" },
];

/** Liens plus complets pour les zones secondaires comme le footer. */
export const footerLinks: NavLink[] = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/#a-propos" },
  ...navLinks,
  { label: "Avis", href: "/#avis-clients" },
];

/** Avantages listés dans la section QR code. */
export const qrFeatures: string[] = [
  "Accès au menu",
  "Commande rapide",
  "Paiement sécurisé",
  "Livraison à domicile",
];

/** Points forts listés dans la section À propos. */
export const aboutPoints: string[] = [
  "Viandes marinées et grillées au charbon",
  "Pide, lahmacun et börek faits maison",
  "Mezze, baklava et desserts maison",
  "Équipe passionnée et accueillante",
];
