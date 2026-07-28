# Guide de déploiement — restaurant turc

> Pour le déploiement sur le VPS de production (`lodene.cloud`),
> voir `DEPLOIEMENT-VPS.md`. Ce guide-ci décrit l'alternative Vercel + base managée.

Déploiement recommandé : **Vercel** (app Next.js) + **base PostgreSQL managée**
(Neon ou Supabase) + **Stripe** + **Resend**.

> ⚠️ **La médiathèque du CRM (`/admin/medias`) ne fonctionne pas sur Vercel.**
> Les photos téléversées sont écrites sur le système de fichiers
> (`.data/uploads`, voir `src/lib/media.ts`), or celui de Vercel est éphémère et
> non partagé entre instances : un envoi réussirait puis disparaîtrait au
> déploiement suivant, laissant des images mortes en base. Un hébergement avec
> disque persistant est requis — c'est le cas du VPS Docker décrit dans
> `DEPLOIEMENT-VPS.md`, qui monte un volume `uploads`. Sur Vercel, seules les
> images livrées avec le dépôt (`public/images`) restent utilisables.

---

## 1. Base de données PostgreSQL managée

Créer une base sur [Neon](https://neon.tech) ou [Supabase](https://supabase.com)
et récupérer la chaîne de connexion (`postgresql://…`).

> Neon/Supabase exigent le SSL : ajouter `?sslmode=require` à l'URL.

---

## 2. Variables d'environnement (Vercel → Project → Settings → Environment Variables)

| Variable                              | Obligatoire | Description                                                    |
| ------------------------------------- | ----------- | -------------------------------------------------------------- |
| `DATABASE_URL`                        | ✅          | URL PostgreSQL managée (`?sslmode=require`)                    |
| `NEXT_PUBLIC_SITE_URL`                | ✅          | URL publique finale (ex. `https://lodene.cloud`)               |
| `SESSION_SECRET`                      | ✅          | Secret aléatoire (`openssl rand -hex 32`)                      |
| `ADMIN_EMAILS`                        | ✅          | Emails admin séparés par des virgules                          |
| `DEFAULT_RESTAURANT_SLUG`             | ⬜          | Slug de l'établissement par défaut (défaut `anatolia-grill`, créé par le seed) |
| `STRIPE_SECRET_KEY`                   | ⬜          | Clé secrète Stripe (`sk_live_…`)                               |
| `STRIPE_WEBHOOK_SECRET`               | ⬜          | Secret du webhook Stripe (`whsec_…`)                           |
| `STRIPE_CONNECT_COUNTRY`              | ⬜          | Pays des comptes Connect créés depuis l’admin (ex. `FR`)       |
| `RESEND_API_KEY`                      | ⬜          | Clé API Resend (emails transactionnels)                        |
| `EMAIL_FROM`                          | ⬜          | Expéditeur vérifié (ex. `Anatolia Grill <contact@lodene.org>`) |
| `NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER`   | ⬜          | Numéro public pour les commandes WhatsApp (`+33...`)           |
| `NEXT_PUBLIC_TELEGRAM_ORDER_USERNAME` | ⬜          | Username Telegram public du restaurant, sans `@`               |
| `NEXT_PUBLIC_FACEBOOK_URL`            | ⬜          | URL de la page Facebook affichée dans le footer                |
| `NEXT_PUBLIC_INSTAGRAM_URL`           | ⬜          | URL du compte Instagram affiché dans le footer                 |
| `NEXT_PUBLIC_TIKTOK_URL`              | ⬜          | URL du compte TikTok affiché dans le footer                    |
| `NEXT_PUBLIC_TELEGRAM_URL`            | ⬜          | URL Telegram explicite, si différente de l'username            |
| `WHATSAPP_ORDER_TO`                   | ⬜          | Numéro interne qui reçoit les commandes WhatsApp via Twilio    |
| `TELEGRAM_BOT_TOKEN`                  | ⬜          | Token du bot Telegram pour notifier le restaurant              |
| `TELEGRAM_ORDER_CHAT_ID`              | ⬜          | Chat/groupe Telegram qui reçoit les commandes                  |
| `UPSTASH_REDIS_REST_URL`              | ⬜          | Rate-limiting distribué (recommandé en prod)                   |
| `UPSTASH_REDIS_REST_TOKEN`            | ⬜          | Jeton Upstash                                                  |

---

## 3. Déploiement

```bash
# Connexion + import du projet
npx vercel link
# Pousser les variables ci-dessus, puis :
npx vercel --prod
```

Le `buildCommand` de [vercel.json](vercel.json) lance automatiquement
`prisma generate && prisma migrate deploy && next build` — les migrations sont
appliquées à chaque déploiement.

---

## 4. Stripe (paiement réel + Connect)

1. Dashboard Stripe → **Developers → API keys** → copier `sk_live_…` dans `STRIPE_SECRET_KEY`.
2. **Developers → Webhooks → Add endpoint** :
   - URL : `https://lodene.cloud/api/webhooks/stripe`
   - Événements : `checkout.session.completed`, `checkout.session.expired`
   - Copier le `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.
3. Test local du webhook :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Dans `/admin/parametres` :
   - créer/éditer les restaurants,
   - cliquer **Ouvrir onboarding** pour chaque restaurant,
   - finaliser l’onboarding Stripe Express,
   - cliquer **Synchroniser** pour valider `charges_enabled` et `payouts_enabled`.

Sans clé Stripe, le paiement reste en **mode simulation** (la commande passe
directement en « payée »).

---

## 5. Emails (Resend)

1. Créer un compte [Resend](https://resend.com), **vérifier votre domaine**
   (DNS SPF/DKIM).
2. Renseigner `RESEND_API_KEY` et `EMAIL_FROM` (adresse du domaine vérifié).

Sans clé, les emails sont **loggés en console** (mode dev/simulation).

---

## 6. Commandes WhatsApp / Telegram

Les boutons de commande par messagerie utilisent :

- WhatsApp : `https://wa.me/<numero>?text=<message>`
- Telegram : `https://t.me/share/url?url=<site>&text=<message>`

Pour recevoir automatiquement chaque commande côté restaurant :

1. WhatsApp : renseigner `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   `TWILIO_WHATSAPP_FROM` et `WHATSAPP_ORDER_TO`.
2. Telegram : créer un bot via BotFather, l'ajouter au chat/groupe de commande,
   puis renseigner `TELEGRAM_BOT_TOKEN` et `TELEGRAM_ORDER_CHAT_ID`.

Sans ces clés privées, le site reste fonctionnel et logge les notifications en
mode simulation.

---

## 7. Rate-limiting en production

Le limiteur ([src/lib/rate-limit.ts](src/lib/rate-limit.ts)) utilise
automatiquement [Upstash Ratelimit](https://github.com/upstash/ratelimit) quand
`UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont renseignées.

Sans ces variables, l'application conserve un fallback **en mémoire**, adapté au
développement local mais insuffisant en multi-instances/serverless.

---

## 8. Checklist avant mise en ligne

- [ ] Remplir les vraies coordonnées dans [src/lib/config.ts](src/lib/config.ts)
- [ ] Compléter les pages légales (`/mentions-legales`, `/cgv`, `/confidentialite`)
- [ ] Remplacer les photos de stock par les vraies photos du restaurant
- [ ] `SESSION_SECRET` fort et unique
- [ ] Domaine + HTTPS configurés sur Vercel
- [ ] Webhook Stripe testé en production
- [ ] Stripe Connect finalisé pour chaque restaurant actif
- [ ] Domaine email vérifié sur Resend
- [ ] Numéros WhatsApp et bot Telegram testés avec de vraies commandes
- [ ] Brancher un suivi d'erreurs (ex. Sentry) et analytics
