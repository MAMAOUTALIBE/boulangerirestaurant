# Mettre à jour le site en ligne

Runbook de mise à jour du restaurant turc sur le serveur de production
(`votre-domaine.fr`, projet Docker Compose `restaurant-turc`, port 3200).
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
DEPLOY_VPS="root@IP_VPS_HOSTINGER" \
DEPLOY_REMOTE_DIR="/root/restaurant-turc" \
DEPLOY_SITE_URL="https://votre-domaine.fr" \
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
ssh -i "$HOME/.ssh/deploy_key" root@IP_VPS_HOSTINGER \
  "cd /root/restaurant-turc && cp .env.production.example .env && nano .env"
```

## Variables

| Variable | Rôle |
| --- | --- |
| `DEPLOY_VPS` | Accès SSH au VPS Hostinger, par exemple `root@IP_VPS_HOSTINGER` |
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

- Aucun remote GitHub n'est configuré (nouveau dépôt propre à créer). Ne pas `git push`.
- Les secrets restent exclus de `rsync` : `.env`, `.env.local`, `.env*.local`.
- Ne lancer le script de déploiement qu'après avoir confirmé le nouveau serveur
  et le nouveau domaine.
