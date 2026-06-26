# Anatolia Grill

Application **full-stack** pour un restaurant turc : vitrine, carte,
commande en ligne, paiement Stripe-ready, espace client et back-office.

Le dépôt local est prêt pour un nouveau dépôt GitHub dédié au restaurant.
Aucun push ne doit être fait avant d'avoir configuré ce nouveau remote.

## Fonctionnalités

| Domaine  | Implémentation                                            |
| -------- | --------------------------------------------------------- |
| Vitrine  | Hero, spécialités, avis, contact, QR code et SEO          |
| Menu     | Mezze, grillades, kebabs, pide, desserts et boissons      |
| Commande | Panier persistant, créneau, retrait/livraison/sur place   |
| Paiement | Stripe Checkout si configuré, simulation sinon            |
| Client   | Connexion par lien magique et historique des commandes    |
| Admin    | Commandes, statuts, menu, clients, livraisons, rapports   |
| Traiteur | Demandes de devis pour entreprises, buffets et événements |

## Stack

- Next.js 16 App Router
- TypeScript strict
- PostgreSQL + Prisma 6
- Tailwind CSS 3
- Zod, Vitest, Testing Library
- Stripe, Resend, Twilio et Upstash en intégrations optionnelles

## Démarrer

```bash
# Base de données PostgreSQL locale
docker run --name restaurant-turc-pg \
  -e POSTGRES_PASSWORD=restaurant_turc \
  -e POSTGRES_USER=restaurant_turc \
  -e POSTGRES_DB=restaurant_turc \
  -p 5440:5432 -d postgres:16

cp .env.example .env.local
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Le site local démarre sur `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
npm run db:migrate
npm run db:seed
```

## Données de démonstration

Le seed crée :

- l'établissement `anatolia-grill`,
- les catégories entrées & mezze, grillades, pide, spécialités, desserts et boissons,
- le code promo `BIENVENUE10`,
- les horaires 11h30-23h00,
- les zones de livraison existantes autour de Juvisy-sur-Orge.

Le seed archive les anciennes entrées qui ne font pas partie de la carte turque
de référence.
