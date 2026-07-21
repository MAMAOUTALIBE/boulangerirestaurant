# Déployer ce site pour plusieurs restaurants

Ce dépôt est **UN seul code** déployé plusieurs fois, **une instance isolée par
restaurant** (stratégie _multi-instance_). Chaque restaurant a :

- sa propre **base Postgres** (volume Docker dédié),
- son propre **domaine** + vhost Nginx,
- son propre **port** local, son **projet Docker Compose**, son fichier `.env`
  distant (secrets),
- son **identité, menu, couleurs, assets** — la plupart réglables sans toucher au
  code.

> **Pourquoi multi-instance et pas multi-tenant ?** Le code isole déjà chaque site
> par projet Compose + volume + port + vhost, et l'identité/menu/couleurs vivent
> déjà en base éditable. Un vrai multi-tenant (une instance qui sert N restaurants)
> exigerait de scoper toutes les requêtes par `restaurantId` (aujourd'hui
> `SiteSetting`/`OrderingSetting` sont des singletons `"default"`, et
> `Category`/`Dish`/`OpeningHour`/`PromoCode` n'ont pas de `restaurantId`) : gros
> refactor, justifié seulement à grande échelle. Le multi-instance donne aussi une
> isolation totale des données, secrets et comptes Stripe.

---

## 1. Qu'est-ce qui se personnalise, et où ?

| Élément | Où le régler | Détail |
| --- | --- | --- |
| Nom, description, téléphone, e-mail, adresse, ville, horaires, réseaux, WhatsApp/Telegram | **CRM** `/admin/parametres` (DB `SiteSetting`) | Repli technique : `.env` distant / `defaultSiteConfig` |
| Palette de couleurs (ambre / terracotta / émeraude) | **CRM** `/admin/parametres` (DB `OrderingSetting.colorPalette`) | |
| Menu : catégories, plats, prix, options | **CRM** `/admin/menu` (DB) | Contenu de départ éventuel via le **profil de seed** |
| Zones de livraison, horaires, réglages de créneaux | **CRM** `/admin` (DB) | Valeurs de départ via le profil de seed |
| Logo, favicon, photos (hero, galerie), image OG | **Overlay d'assets** `deploy/clients/<slug>/overlay/` | Poussé par rsync au déploiement, remplace les assets du template |
| Domaine, port, projet Compose, VPS | `deploy/clients/<slug>.env` (cible) | Pas de secrets |
| Secrets : DB, admin, Stripe, e-mail/SMS, cron | **`.env` distant** sur le VPS (`.env.client.example`) | Jamais commité, jamais rsync'é |
| Restaurant par défaut (commandes + Stripe Connect) | `DEFAULT_RESTAURANT_SLUG` (`.env` distant) | Doit correspondre au restaurant **provisionné** |
| Géolocalisation (distance livraison, SEO) | `RESTAURANT_LATITUDE` / `RESTAURANT_LONGITUDE` (`.env` distant) | |

**Règle d'or :** tout ce qui est **texte affiché** se règle dans le CRM ; tout ce
qui est **secret ou infrastructure** vit dans le `.env` distant ; tout ce qui est
**média** vit dans l'overlay.

---

## 2. Ajouter un restaurant — checklist de première mise en ligne

Prérequis : accès SSH au VPS, un domaine, `deploy/redeploy.sh` fonctionne déjà
pour Anatolia (donc clé SSH OK).

### a) DNS

Faire pointer `mondomaine.fr` **et** `www.mondomaine.fr` (enregistrements A) vers
l'IP du VPS.

### b) Choisir un port + créer la config de cible

1. Ouvrir `deploy/clients/PORTS.md`, choisir un **port libre** (plage 3201–3299)
   et l'y noter (slug, domaine, port, projet Compose, dossier distant).
2. Créer la config de déploiement :
   ```bash
   cp deploy/clients/EXEMPLE.env deploy/clients/<slug>.env
   ```
   Renseigner `DEPLOY_VPS`, `DEPLOY_REMOTE_DIR=/root/<slug>`, `DEPLOY_SITE_URL`,
   `DEPLOY_COMPOSE_PROJECT=<slug>`, `APP_HOST_PORT=<port choisi>`.

### c) Créer le profil de seed du restaurant

1. Copier le squelette :
   ```bash
   cp prisma/seeds/blank.ts prisma/seeds/<slug>.ts
   ```
   Mettre à jour `restaurant.slug` / `name` (le `slug` doit être unique et égal à
   `DEFAULT_RESTAURANT_SLUG`). Éventuellement pré-remplir `identity`, `categories`,
   `dishes`, `deliveryZones`. Garder `resetStrategy: "additive"` (non destructif).
2. L'enregistrer dans le registre `PROFILES` de `prisma/seed.ts` :
   ```ts
   import monResto from "./seeds/<slug>";
   const PROFILES = { "anatolia-grill": anatoliaGrill, blank, "<slug>": monResto };
   ```

### d) (optionnel) Déposer les assets du restaurant

Placer logo/favicon/photos dans `deploy/clients/<slug>/overlay/`, en respectant
l'arborescence du dépôt :

```
deploy/clients/<slug>/overlay/src/app/favicon.ico
deploy/clients/<slug>/overlay/src/app/icon.svg
deploy/clients/<slug>/overlay/public/images/hero-plateau-turc-premium.png
```

Laisser vide = les assets par défaut du template sont conservés.

### e) Préparer le `.env` distant (secrets)

1. Copier le modèle vers le VPS et le remplir **sur le serveur** :
   ```bash
   ssh root@IP "mkdir -p /root/<slug>"
   scp .env.client.example root@IP:/root/<slug>/.env
   ssh root@IP "nano /root/<slug>/.env"
   ```
2. Renseigner au minimum : `POSTGRES_PASSWORD`, `NEXT_PUBLIC_SITE_URL`,
   `APP_HOST_PORT` (= le port choisi), `SESSION_SECRET`, `ADMIN_EMAILS`,
   `ADMIN_PASSWORD`, `DEFAULT_RESTAURANT_SLUG=<slug>`. Stripe/e-mail/SMS sont
   optionnels (repli « simulé »).

### f) Premier déploiement (build + migrations)

```bash
./deploy/deploy-client.sh <slug>
```

Le script fait : vérifs locales → rsync du code → overlay d'assets → build Docker →
**migrations Prisma automatiques** → contrôle `/api/health`.

### g) Provisionner le contenu initial (une seule fois)

Les migrations créent les tables **vides**. Pour injecter le restaurant + le
contenu de départ du profil, lancer le seed **dans le conteneur** (non destructif) :

```bash
ssh root@IP "cd /root/<slug> && \
  docker compose -p <slug> --env-file .env run --rm \
    -e SEED_PROFILE=<slug> migrate node_modules/.bin/tsx prisma/seed.ts"
```

> ⚠️ Ne JAMAIS lancer ceci avec `SEED_PROFILE=anatolia-grill` en production : ce
> profil est **destructif** (désactive les autres restaurants/plats). Les profils
> clients sont `additive` (upsert only). Ne jamais lancer `prisma migrate reset`.

### h) Vhost Nginx + HTTPS

```bash
DOMAIN=mondomaine.fr PORT=<port choisi>
sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__PORT__/$PORT/g" \
  deploy/nginx.template.conf | ssh root@IP "cat > /etc/nginx/sites-available/$DOMAIN"
ssh root@IP "ln -sf ../sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN && nginx -t && systemctl reload nginx"
ssh root@IP "certbot --nginx -d $DOMAIN -d www.$DOMAIN"
```

### i) Finaliser dans le CRM

Se connecter à `https://mondomaine.fr/admin`, puis dans `/admin/parametres`
ajuster identité + palette, et dans `/admin/menu` compléter la carte.

---

## 3. Mettre à jour un restaurant (déploiement courant)

```bash
./deploy/deploy-client.sh <slug>       # n'importe quel restaurant
./deploy/redeploy.sh                   # raccourci = anatolia-grill
```

Idempotent : rsync + rebuild + migrations. **Ne relance pas le seed** (le contenu
vit en base, édité depuis le CRM). Refaire l'étape (g) seulement pour un **nouveau**
restaurant ou pour ré-appliquer volontairement un contenu de départ.

---

## 4. Isolation — ne jamais casser un autre site

Le VPS héberge plusieurs sites. Chaque commande est **scopée** au projet Compose du
restaurant (`-p <slug>`). On ne touche jamais aux conteneurs/ports/volumes des
autres (`restaurant-turc`=3201, boulangerie/lodene.org=3101, ancien resto=3100,
es-viry=8090 — voir `deploy/clients/PORTS.md`). Un dossier distant, un volume
Postgres, un port, un vhost **par restaurant**.

---

## 5. Fichiers de référence

| Fichier | Rôle |
| --- | --- |
| `deploy/deploy-client.sh <slug>` | Déploiement générique d'un restaurant |
| `deploy/clients/<slug>.env` | Params de cible (VPS, domaine, port, projet Compose) |
| `deploy/clients/EXEMPLE.env` | Modèle à copier |
| `deploy/clients/PORTS.md` | Registre des ports (anti-collision) |
| `deploy/clients/<slug>/overlay/` | Assets propres au restaurant (hors dépôt) |
| `deploy/nginx.template.conf` | Modèle de vhost (`__DOMAIN__`, `__PORT__`) |
| `deploy/update-production.sh` | Moteur : vérifs → rsync → overlay → build → health |
| `.env.client.example` | Modèle du `.env` distant (secrets) |
| `prisma/seeds/types.ts` | Type d'un profil de seed |
| `prisma/seeds/<slug>.ts` | Contenu de départ d'un restaurant |
| `prisma/seed.ts` | Lanceur (`SEED_PROFILE`, registre `PROFILES`) |

Voir aussi `DEPLOIEMENT-VPS.md` (premier déploiement détaillé) et
`deploy/MISE-A-JOUR.md`.
