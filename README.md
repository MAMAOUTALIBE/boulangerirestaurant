# Boulangerie Artisanale

Application **full-stack** pour une boulangerie artisanale : vitrine, menu,
commande en ligne, paiement Stripe-ready, espace client et back-office.

Le dépôt local est prêt pour un nouveau dépôt GitHub dédié à la boulangerie.
Aucun push ne doit être fait avant d'avoir configuré ce nouveau remote.

## Fonctionnalités

| Domaine  | Implémentation                                            |
| -------- | --------------------------------------------------------- |
| Vitrine  | Hero, spécialités, avis, contact, QR code et SEO          |
| Menu     | Pains, viennoiseries, pâtisseries, snacking et boissons   |
| Commande | Panier persistant, créneau, retrait/livraison/sur place   |
| Paiement | Stripe Checkout si configuré, simulation sinon            |
| Client   | Connexion par lien magique et historique des commandes    |
| Admin    | Commandes, statuts, menu, clients, livraisons, rapports   |
| Traiteur | Demandes de devis pour entreprises, brunchs et événements |

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
docker run --name boulangerie-pg \
  -e POSTGRES_PASSWORD=boulangerie \
  -e POSTGRES_USER=boulangerie \
  -e POSTGRES_DB=boulangerie \
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

- l'établissement `boulangerie`,
- les catégories pains, viennoiseries, pâtisseries, snacking et boissons,
- le code promo `BOULANGERIE10`,
- les horaires 7h00-19h30,
- les zones de livraison existantes autour de Juvisy-sur-Orge.

Les anciennes données de démonstration turques sont rendues indisponibles par
le seed si elles existent encore dans la base.
