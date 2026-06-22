import type { LucideIcon } from "lucide-react";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tag?: string;
}

/** Une option choisie sur une ligne de panier. */
export interface CartLineOption {
  groupId: string;
  optionId: string;
  label: string;
  priceDelta: number;
}

/** Données nécessaires pour ajouter un plat au panier (avec options/note). */
export interface AddToCartInput {
  dishId: string;
  name: string;
  image: string;
  basePrice: number;
  options?: CartLineOption[];
  note?: string;
}

/** Une ligne du panier : plat configuré (options + note) + quantité. */
export interface CartItem {
  /** Clé composite : plat + options + note (lignes distinctes si config différente). */
  lineId: string;
  dishId: string;
  name: string;
  image: string;
  basePrice: number;
  /** Prix unitaire = base + somme des options. */
  unitPrice: number;
  quantity: number;
  options: CartLineOption[];
  note?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number; // 1..5
  comment: string;
  city?: string;
}

export interface Service {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface NavLink {
  label: string;
  href: string;
}

export type OrderStatus =
  | "en attente"
  | "payée"
  | "en préparation"
  | "prête"
  | "en livraison"
  | "livrée"
  | "annulée";

export type Fulfillment = "livraison" | "emporter" | "surplace";

export interface OrderLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options?: CartLineOption[];
  note?: string;
}

export interface Order {
  id: string;
  restaurantId?: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  customer: {
    email: string;
    name: string;
    phone: string;
    address?: string;
    notes?: string;
  };
  items: OrderLine[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  fulfillment: Fulfillment;
  deliveryFee: number;
  tip: number;
  scheduledAt?: string;
  prepTimeMin: number;
  total: number;
}
