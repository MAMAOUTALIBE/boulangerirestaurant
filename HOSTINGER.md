# Déploiement sur le VPS Hostinger — Boulangerie

> ⚠️ **VPS partagé** : un site « restaurant » tourne **déjà** sur ce VPS. Tout ici
> est isolé pour **ne pas y toucher** :
>
> - projet Docker Compose dédié : **`boulangerie`**
> - base PostgreSQL dédiée (volume `boulangerie_pgdata`)
> - port hôte **3200** (le 3000 est pris par l'autre site)
> - fichier Nginx **séparé** (`/etc/nginx/sites-available/boulangerie`)
>
> L'app est **Next.js full-stack** (Server Actions, API, Prisma, PostgreSQL) → elle
> tourne en **Docker Compose** (app Next.js + PostgreSQL) derrière **Nginx** + **HTTPS
> Let's Encrypt**. Domaine cible : **`boulangerie.lodene.cloud`**.

---

## 1. DNS (sous-domaine → VPS)

Dans la zone DNS de `lodene.cloud`, ajouter **un seul** enregistrement :

- `A` `boulangerie` → IP du VPS

(Pas de `www` pour un sous-domaine.)

## 2. Pré-requis sur le VPS

Docker, le plugin Compose et Nginx sont **déjà installés** (site « restaurant »). Vérifier :

```bash
docker --version && docker compose version && nginx -v
```

> Ne **pas** relancer `apt upgrade` ni réinstaller Docker/Nginx : cela pourrait
> perturber le site déjà en ligne.

## 3. Récupérer le code + configurer

```bash
cd /root                                  # ou le dossier qui héberge déjà tes sites
git clone VOTRE_DEPOT boulangerie && cd boulangerie
cp .env.production.example .env
nano .env                                 # remplir les valeurs (voir ci-dessous)
```

Générer les secrets :

```bash
openssl rand -hex 32   # → SESSION_SECRET
openssl rand -hex 16   # → CRON_SECRET
```

Variables minimales à remplir :

- `POSTGRES_PASSWORD` (mot de passe fort)
- `NEXT_PUBLIC_SITE_URL=https://boulangerie.lodene.cloud`
- `SESSION_SECRET`
- `ADMIN_EMAILS` (ton email admin)

Les intégrations (Stripe, Resend, Twilio, Upstash) sont **optionnelles** : sans clés,
l'app tourne en mode simulation. `POSTGRES_USER`, `POSTGRES_DB` et
`DEFAULT_RESTAURANT_SLUG` ont déjà la valeur `boulangerie` par défaut.

## 4. Lancer l'application (projet isolé `boulangerie`)

```bash
docker compose -p boulangerie --env-file .env up -d --build
```

- Le conteneur **db** (PostgreSQL) démarre avec son **volume dédié** (`boulangerie_pgdata`).
- Le service **migrate** applique **automatiquement les migrations** (`prisma migrate deploy`)
  puis s'arrête ; l'**app** ne démarre qu'une fois les migrations réussies, exposée
  sur **`127.0.0.1:3200`** uniquement (Nginx fait le reverse-proxy).

> `-p boulangerie` est **important** : il garde les conteneurs, le réseau et le volume
> séparés du site « restaurant ». À rappeler sur **chaque** commande `docker compose`.

### Charger les données initiales (menu, catégories, zones, horaires, code promo) — une seule fois

```bash
docker compose -p boulangerie --env-file .env run --rm migrate npm run db:seed
```

Vérifier (en local sur le VPS) :

```bash
curl http://127.0.0.1:3200/api/health   # → {"status":"ok","db":"up"}
```

## 5. Nginx (nouveau site, sans toucher l'existant)

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/boulangerie
ln -s /etc/nginx/sites-available/boulangerie /etc/nginx/sites-enabled/boulangerie
nginx -t && systemctl reload nginx
```

> Le fichier pointe déjà vers `boulangerie.lodene.cloud` et le port **3200**.
> **Ne pas** supprimer `sites-enabled/default` ni la conf du site « restaurant ».

## 6. HTTPS (Let's Encrypt)

```bash
certbot --nginx -d boulangerie.lodene.cloud
```

Certbot configure le SSL + la redirection 80→443 automatiquement (il est déjà
installé pour l'autre site ; sinon `apt install -y certbot python3-certbot-nginx`).

## 7. Intégrations (quand tu as les clés)

- **Stripe** : ajouter `STRIPE_SECRET_KEY` + créer un webhook
  `https://boulangerie.lodene.cloud/api/webhooks/stripe` (événements
  `checkout.session.completed`, `checkout.session.expired`) → `STRIPE_WEBHOOK_SECRET`.
- **Resend** : `RESEND_API_KEY` + domaine vérifié (SPF/DKIM), `EMAIL_FROM`.
- **Twilio** : `TWILIO_*` pour SMS/WhatsApp.
- Après modif du `.env` : `docker compose -p boulangerie --env-file .env up -d` (recharge l'app).

## 8. Relance automatique (cron)

Sur le VPS, `crontab -e` :

```
0 10 * * 1 curl -s -H "Authorization: Bearer VOTRE_CRON_SECRET" https://boulangerie.lodene.cloud/api/cron/reengage
```

## 9. Sauvegardes de la base (recommandé)

```bash
# Dump quotidien à 3h
0 3 * * * docker compose -p boulangerie -f /root/boulangerie/docker-compose.yml exec -T db pg_dump -U boulangerie boulangerie > /root/backups/boulangerie-$(date +\%F).sql
```

## 10. Mises à jour de l'app

Depuis ce Mac (recommandé), avec le script automatisé :

```bash
DEPLOY_VPS="root@IP_DU_VPS" \
DEPLOY_REMOTE_DIR="/root/boulangerie" \
DEPLOY_SITE_URL="https://boulangerie.lodene.cloud" \
./deploy/update-production.sh
```

Voir `deploy/MISE-A-JOUR.md`. Ou directement sur le VPS :

```bash
cd /root/boulangerie
git pull
docker compose -p boulangerie --env-file .env up -d --build    # rebuild + migrations auto
```

---

## ✅ Checklist de mise en ligne

- [ ] DNS : `A` `boulangerie` → IP du VPS
- [ ] `.env` rempli (secrets forts), `NEXT_PUBLIC_SITE_URL=https://boulangerie.lodene.cloud`
- [ ] `docker compose -p boulangerie --env-file .env up -d --build` OK
- [ ] `curl http://127.0.0.1:3200/api/health` = `{"status":"ok","db":"up"}`
- [ ] Données initiales chargées (`db:seed`)
- [ ] Site Nginx `boulangerie` activé (sans toucher au site « restaurant »)
- [ ] Certbot (HTTPS) actif sur `boulangerie.lodene.cloud`
- [ ] Webhook Stripe configuré (si paiement réel)
- [ ] Domaine email vérifié (si emails réels)
- [ ] Cron de relance + sauvegardes DB
- [ ] Coordonnées réelles dans `src/lib/config.ts` + textes légaux validés

## 🔐 Sécurité

- Next.js est en **16** (à jour) — garder les patchs à jour lors des fenêtres de maintenance.
- Le port app n'est exposé qu'en **local** (`127.0.0.1:3200`) ; seul Nginx est public.
- Vérifier que le pare-feu (`ufw`) de l'autre site autorise déjà `Nginx Full` (80/443).
