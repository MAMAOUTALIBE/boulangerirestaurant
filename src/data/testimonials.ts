import type { Testimonial } from "@/types";

export const testimonials: Testimonial[] = [
  {
    id: "marie",
    name: "Marie L.",
    avatar: "/images/avatar-marie.jpg",
    rating: 5,
    comment:
      "Le thiéboudiène est savoureux, généreux et parfaitement assaisonné. Un vrai régal !",
    city: "Paris",
  },
  {
    id: "benoit",
    name: "Benoît A.",
    avatar: "/images/avatar-benoit.jpg",
    rating: 5,
    comment:
      "Commande en ligne très pratique, poulet yassa généreux et accueil toujours chaleureux.",
    city: "Lyon",
  },
  {
    id: "aissata",
    name: "Aïssata K.",
    avatar: "/images/avatar-aissata.jpg",
    rating: 5,
    comment:
      "Une vraie adresse de quartier : mafé maison, bissap délicieux et équipe chaleureuse.",
    city: "Marseille",
  },
];
