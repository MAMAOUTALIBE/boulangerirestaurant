import type { Testimonial } from "@/types";

export const testimonials: Testimonial[] = [
  {
    id: "marie",
    name: "Marie L.",
    avatar: "/images/avatar-marie.jpg",
    rating: 5,
    comment:
      "Les croissants sont feuilletés comme il faut et le pain reste excellent même le soir.",
    city: "Paris",
  },
  {
    id: "benoit",
    name: "Benoît A.",
    avatar: "/images/avatar-benoit.jpg",
    rating: 5,
    comment:
      "Commande en ligne très pratique, sandwichs frais et accueil toujours rapide.",
    city: "Lyon",
  },
  {
    id: "aissata",
    name: "Aïssata K.",
    avatar: "/images/avatar-aissata.jpg",
    rating: 5,
    comment:
      "Une vraie adresse de quartier : pains au levain, pâtisseries soignées et équipe chaleureuse.",
    city: "Marseille",
  },
];
