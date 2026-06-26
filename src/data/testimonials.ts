import type { Testimonial } from "@/types";

export const testimonials: Testimonial[] = [
  {
    id: "marie",
    name: "Marie L.",
    avatar: "/images/avatar-marie.jpg",
    rating: 5,
    comment:
      "Les grillades sont savoureuses et parfaitement cuites au charbon. Un vrai régal !",
    city: "Paris",
  },
  {
    id: "benoit",
    name: "Benoît A.",
    avatar: "/images/avatar-benoit.jpg",
    rating: 5,
    comment:
      "Commande en ligne très pratique, adana kebab généreux et accueil toujours rapide.",
    city: "Lyon",
  },
  {
    id: "aissata",
    name: "Aïssata K.",
    avatar: "/images/avatar-aissata.jpg",
    rating: 5,
    comment:
      "Une vraie adresse de quartier : lahmacun maison, baklava délicieux et équipe chaleureuse.",
    city: "Marseille",
  },
];
