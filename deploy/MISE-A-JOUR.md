# Mettre à jour le site en ligne

Runbook de mise à jour du restaurant turc sur le serveur de production
(`lodene.cloud`, projet Docker Compose `restaurant-turc`, port local 3201).
La première mise en ligne est décrite dans `DEPLOIEMENT-VPS.md`.

## Le plus simple (recommandé)

Une seule commande, tous les paramètres pré-remplis :

```bash
./deploy/redeploy.sh
```

(Idéal pour confier le redéploiement à un agent comme Codex — voir `AGENTS.md`.)

## Méthode rapide (paramètres explicites)

Depuis la racine du projet (sur ce Mac) :

```bash
DEPLOY_VPS="root@213.130.144.215" \
DEPLOY_REMOTE_DIR="/root/restaurant-turc" \
DEPLOY_SITE_URL="https://lodene.cloud" \
DEPLOY_KEY="$HOME/.ssh/deploy_key" \
DEPLOY_COMPOSE_PROJECT="restaurant-turc" \
./deploy/update-production.sh
```

Le script fait : vérifs locales (`typecheck`, `lint`, `build`),
synchronisation du code, rebuild Docker, migrations Prisma automatiques, puis
vérification `/api/health`.

Au premier passage sur un VPS neuf, le script synchronise le code puis s'arrête
si `/root/restaurant-turc/.env` n'existe pas encore. Créez alors le fichier sur
le VPS depuis le modèle synchronisé, remplissez les secrets, puis relancez la
commande :

```bash
ssh -i "$HOME/.ssh/deploy_key" root@213.130.144.215 \
  "cd /root/restaurant-turc && cp .env.production.example .env && nano .env"
```

## Variables

| Variable | Rôle |
| --- | --- |
| `DEPLOY_VPS` | Accès SSH au VPS Hostinger, actuellement `root@213.130.144.215` |
| `DEPLOY_REMOTE_DIR` | Dossier du projet sur le serveur |
| `DEPLOY_SITE_URL` | URL publique du nouveau site |
| `DEPLOY_KEY` | Clé SSH à utiliser, optionnelle |
| `DEPLOY_COMPOSE_PROJECT` | Nom du projet Docker Compose, défaut `restaurant-turc` |

## Vérifications locales

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Notes

- GitHub contient l'historique source, mais le VPS ne fait pas de `git pull` :
  le déploiement se fait par `rsync` + rebuild Docker.
- Les secrets restent exclus de `rsync` : `.env`, `.env.local`, `.env*.local`.
- Ne pas utiliser les paramètres de la boulangerie (`/root/boulangerie`,
  `lodene.org`, projet Compose `boulangerie`) pour ce site.
