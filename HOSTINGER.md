# Déploiement sur Hostinger (VPS) — restaurant

> ⚠️ **Important** : l'application est **Next.js full-stack** (Server Actions, API, Prisma,
> PostgreSQL). Elle nécessite un **serveur Node.js** → choisir un **VPS Hostinger**
> (KVM), **pas** l'hébergement mutualisé (qui ne fait pas tourner Next.js en SSR).
>
> Le déploiement se fait avec **Docker Compose** (app Next.js + PostgreSQL),
> derrière **Nginx** + **HTTPS Let's Encrypt**.

---

## 1. Commander le VPS

- Hostinger → **VPS** (KVM 1 minimum : 1 vCPU / 4 Go RAM suffisent pour démarrer).
- Système : **Ubuntu 22.04 (64 bits)**.
- Noter l'**IP publique** du VPS.

## 2. DNS (domaine → VPS)

Dans Hostinger → **Domaines → DNS**, créer :

- `A` `@` → IP du VPS
- `A` `www` → IP du VPS

## 3. Préparer le VPS (SSH)

```bash
ssh root@IP_DU_VPS

# Mises à jour + Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin nginx

# Pare-feu
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```

## 4. Récupérer le code + configurer

```bash
git clone VOTRE_DEPOT restaurant && cd restaurant
cp .env.production.example .env
nano .env   # remplir les valeurs (voir ci-dessous)
```

Générer les secrets :

```bash
openssl rand -hex 32   # → SESSION_SECRET
openssl rand -hex 16   # → CRON_SECRET
```

Variables minimales : `POSTGRES_PASSWORD`, `NEXT_PUBLIC_SITE_URL` (https://votre-domaine),
`SESSION_SECRET`, `ADMIN_EMAILS`.

## 5. Lancer l'application

```bash
docker compose --env-file .env up -d --build
```

- Le conteneur **db** (PostgreSQL) démarre avec un **volume persistant**.
- Le service **migrate** applique **automatiquement les migrations** (`prisma migrate deploy`)
  puis s'arrête ; l'**app** ne démarre qu'une fois les migrations réussies.

### Charger les données initiales (menu, catégories, zones, horaires, code promo) — une seule fois

Le service `migrate` (image complète) sait aussi semer la base :

```bash
docker compose --env-file .env run --rm migrate npm run db:seed
```

Vérifier : `curl http://127.0.0.1:3000/api/health` → `{"status":"ok","db":"up"}`.

## 6. Nginx (reverse proxy)

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/restaurant
sed -i 's/VOTRE-DOMAINE/votre-domaine.fr/g' /etc/nginx/sites-available/restaurant
ln -s /etc/nginx/sites-available/restaurant /etc/nginx/sites-enabled/restaurant
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 7. HTTPS (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d votre-domaine.fr -d www.votre-domaine.fr
```

Certbot configure le SSL + la redirection 80→443 automatiquement.

## 8. Intégrations (quand tu as les clés)

- **Stripe** : ajouter `STRIPE_SECRET_KEY` + créer un webhook
  `https://votre-domaine.fr/api/webhooks/stripe` (événements
  `checkout.session.completed`, `checkout.session.expired`) → `STRIPE_WEBHOOK_SECRET`.
- **Resend** : `RESEND_API_KEY` + domaine vérifié (SPF/DKIM), `EMAIL_FROM`.
- **Twilio** : `TWILIO_*` pour SMS/WhatsApp.
- Après modif du `.env` : `docker compose up -d` (recharge l'app).

## 9. Relance automatique (cron)

Sur le VPS, `crontab -e` :

```
0 10 * * 1 curl -s -H "Authorization: Bearer VOTRE_CRON_SECRET" https://votre-domaine.fr/api/cron/reengage
```

## 10. Sauvegardes de la base (recommandé)

```bash
# Dump quotidien à 3h
0 3 * * * docker compose -f /root/restaurant/docker-compose.yml exec -T db pg_dump -U restaurant restaurant > /root/backups/restaurant-$(date +\%F).sql
```

## 11. Mises à jour de l'app

```bash
cd /root/restaurant
git pull
docker compose --env-file .env up -d --build    # rebuild + migrations auto
```

---

## ✅ Checklist de mise en ligne

- [ ] VPS Ubuntu + Docker + Nginx installés
- [ ] DNS A `@` et `www` → IP du VPS
- [ ] `.env` rempli (secrets forts)
- [ ] `docker compose up -d --build` OK, `/api/health` = ok
- [ ] Données initiales chargées (`db:seed`)
- [ ] Nginx + certbot (HTTPS) actifs
- [ ] `NEXT_PUBLIC_SITE_URL` = https://votre-domaine
- [ ] Webhook Stripe configuré (si paiement réel)
- [ ] Domaine email vérifié (si emails réels)
- [ ] Cron de relance + sauvegardes DB
- [ ] Coordonnées réelles dans `src/lib/config.ts` + textes légaux validés

## 🔐 Sécurité — à traiter après mise en ligne

- **Mettre à jour Next.js** (avis de sécurité sur 14.2.x) vers une version 15/16 LTS
  lors d'une fenêtre de maintenance (changement majeur → re-tester).
