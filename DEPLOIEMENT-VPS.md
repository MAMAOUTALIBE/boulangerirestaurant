# Déploiement sur un VPS — Restaurant turc

> Remplacez les placeholders (`votre-domaine.fr`, `IP_VPS_HOSTINGER`, etc.) par
> vos valeurs réelles Hostinger. Si le serveur héberge **d'autres sites**, tout ici est
> isolé pour **ne pas y toucher** :
>
> - projet Docker Compose dédié : **`restaurant-turc`**
> - base PostgreSQL dédiée (volume `restaurant-turc_pgdata`)
> - port hôte **3200**
> - fichier Nginx **séparé** (`/etc/nginx/sites-available/restaurant-turc`)
>
> L'app est **Next.js full-stack** (Server Actions, API, Prisma, PostgreSQL) → elle
> tourne en **Docker Compose** (app Next.js + PostgreSQL) derrière **Nginx** + **HTTPS
> Let's Encrypt**. Domaine cible : **`votre-domaine.fr`**.

---

## 1. DNS (domaine → serveur)

Dans hPanel Hostinger, récupérez l'IPv4 du VPS. Dans la zone DNS du domaine,
ajouter l'enregistrement :

- `A` `@` (ou le sous-domaine) → IP du serveur

## 2. Pré-requis sur le serveur

Docker, le plugin Compose et Nginx doivent être installés. Vérifier :

```bash
docker --version && docker compose version && nginx -v
```

> Sur un serveur partagé, ne **pas** relancer `apt upgrade` ni réinstaller
> Docker/Nginx sans précaution : cela pourrait perturber un site déjà en ligne.

## 3. Synchroniser le code + configurer

Le déploiement de ce dépôt passe par **rsync depuis le Mac**, pas par `git clone`
sur le serveur.

Depuis ce Mac, lancez une première synchronisation :

```bash
DEPLOY_VPS="root@IP_VPS_HOSTINGER" \
DEPLOY_REMOTE_DIR="/root/restaurant-turc" \
DEPLOY_SITE_URL="https://votre-domaine.fr" \
DEPLOY_KEY="$HOME/.ssh/deploy_key" \
DEPLOY_COMPOSE_PROJECT="restaurant-turc" \
./deploy/update-production.sh
```

Au premier passage, le script crée/synchronise `/root/restaurant-turc`, puis
s'arrête si le `.env` distant n'existe pas encore. Créez-le alors sur le VPS :

```bash
ssh -i "$HOME/.ssh/deploy_key" root@IP_VPS_HOSTINGER \
  "cd /root/restaurant-turc && cp .env.production.example .env && nano .env"
```

Générer les secrets :

```bash
openssl rand -hex 32   # → SESSION_SECRET
openssl rand -hex 32   # → ADMIN_PASSWORD
openssl rand -hex 16   # → CRON_SECRET
```

Variables minimales à remplir :

- `POSTGRES_PASSWORD` (mot de passe fort)
- `NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr`
- `SESSION_SECRET`
- `ADMIN_EMAILS` (votre email admin)
- `ADMIN_PASSWORD` (mot de passe fort du back-office)

Les intégrations (Stripe, Resend, Twilio, Upstash) sont **optionnelles** : sans clés,
l'app tourne en mode simulation. `POSTGRES_USER`, `POSTGRES_DB` et
`DEFAULT_RESTAURANT_SLUG` ont déjà la valeur `anatolia-grill` par défaut.

## 4. Lancer l'application (projet isolé `restaurant-turc`)

Relancez le script depuis le Mac après avoir rempli le `.env` distant :

```bash
DEPLOY_VPS="root@IP_VPS_HOSTINGER" \
DEPLOY_REMOTE_DIR="/root/restaurant-turc" \
DEPLOY_SITE_URL="https://votre-domaine.fr" \
DEPLOY_KEY="$HOME/.ssh/deploy_key" \
DEPLOY_COMPOSE_PROJECT="restaurant-turc" \
./deploy/update-production.sh
```

- Le conteneur **db** (PostgreSQL) démarre avec son **volume dédié** (`restaurant-turc_pgdata`).
- Le service **migrate** applique **automatiquement les migrations** (`prisma migrate deploy`)
  puis s'arrête ; l'**app** ne démarre qu'une fois les migrations réussies, exposée
  sur **`127.0.0.1:3200`** uniquement (Nginx fait le reverse-proxy).

> `-p restaurant-turc` est **important** : il garde les conteneurs, le réseau et le volume
> séparés des autres sites éventuels. À rappeler sur **chaque** commande `docker compose`.

### Données initiales

Ne lancez pas `npm run db:seed` en production : ce seed injecte des données de
démo. Après la première mise en ligne, connectez-vous au back-office et créez ou
importez les données réelles validées : établissement par défaut, carte, zones
de livraison, horaires et paramètres de commande.

Vérifier (en local sur le serveur) :

```bash
curl http://127.0.0.1:3200/api/health   # → {"status":"ok","db":"up"}
```

## 5. Nginx (nouveau site, sans toucher l'existant)

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/restaurant-turc
ln -s /etc/nginx/sites-available/restaurant-turc /etc/nginx/sites-enabled/restaurant-turc
nginx -t && systemctl reload nginx
```

> Le fichier pointe vers `votre-domaine.fr` et le port **3200** (à adapter).
> Sur un serveur partagé, **ne pas** supprimer `sites-enabled/default` ni la conf
> des autres sites.

## 6. HTTPS (Let's Encrypt)

```bash
certbot --nginx -d votre-domaine.fr
```

Certbot configure le SSL + la redirection 80→443 automatiquement
(sinon `apt install -y certbot python3-certbot-nginx`).

## 7. Intégrations (quand vous avez les clés)

- **Stripe** : ajouter `STRIPE_SECRET_KEY` + créer un webhook
  `https://votre-domaine.fr/api/webhooks/stripe` (événements
  `checkout.session.completed`, `checkout.session.expired`) → `STRIPE_WEBHOOK_SECRET`.
- **Resend** : `RESEND_API_KEY` + domaine vérifié (SPF/DKIM), `EMAIL_FROM`.
- **Twilio** : `TWILIO_*` pour SMS/WhatsApp.
- Après modif du `.env` : `docker compose -p restaurant-turc --env-file .env up -d` (recharge l'app).

## 8. Relance automatique (cron)

Sur le serveur, `crontab -e` :

```
0 10 * * 1 curl -s -H "Authorization: Bearer VOTRE_CRON_SECRET" https://votre-domaine.fr/api/cron/reengage
```

## 9. Sauvegardes de la base (recommandé)

```bash
# Dump quotidien à 3h
0 3 * * * docker compose -p restaurant-turc -f /root/restaurant-turc/docker-compose.yml exec -T db pg_dump -U restaurant_turc restaurant_turc > /root/backups/restaurant-turc-$(date +\%F).sql
```

## 10. Mises à jour de l'app

Depuis votre Mac (recommandé), avec le script automatisé :

```bash
DEPLOY_VPS="root@IP_VPS_HOSTINGER" \
DEPLOY_REMOTE_DIR="/root/restaurant-turc" \
DEPLOY_SITE_URL="https://votre-domaine.fr" \
./deploy/update-production.sh
```

Voir `deploy/MISE-A-JOUR.md`. Ne mettez pas à jour par `git pull` sur le
serveur : le flux de production de ce dépôt est rsync depuis le Mac.

---

## ✅ Checklist de mise en ligne

- [ ] DNS : `A` (domaine ou sous-domaine) → IP du serveur
- [ ] `.env` rempli (secrets forts), `NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr`
- [ ] `docker compose -p restaurant-turc --env-file .env up -d --build` OK
- [ ] `curl http://127.0.0.1:3200/api/health` = `{"status":"ok","db":"up"}`
- [ ] Données réelles créées/importées depuis le back-office, sans seed de démo
- [ ] Site Nginx `restaurant-turc` activé (sans toucher aux autres sites)
- [ ] Certbot (HTTPS) actif sur `votre-domaine.fr`
- [ ] Webhook Stripe configuré (si paiement réel)
- [ ] Domaine email vérifié (si emails réels)
- [ ] Cron de relance + sauvegardes DB
- [ ] Coordonnées réelles dans `src/lib/config.ts` + textes légaux validés

## 🔐 Sécurité

- Next.js est en **16** (à jour) — garder les patchs à jour lors des fenêtres de maintenance.
- Le port app n'est exposé qu'en **local** (`127.0.0.1:3200`) ; seul Nginx est public.
- Vérifier que le pare-feu (`ufw`) autorise `Nginx Full` (80/443).
