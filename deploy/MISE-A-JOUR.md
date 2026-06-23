# Mettre à jour le site en ligne

Runbook de mise à jour de la boulangerie sur le VPS Hostinger **partagé**
(`boulangerie.lodene.cloud`, projet Docker Compose `boulangerie`, port 3200).
La première mise en ligne est décrite dans `HOSTINGER.md`.

## Le plus simple (recommandé)

Une seule commande, tous les paramètres pré-remplis :

```bash
./deploy/redeploy.sh
```

(Idéal pour confier le redéploiement à un agent comme Codex — voir `AGENTS.md`.)

## Méthode rapide (paramètres explicites)

Depuis la racine du projet (sur ce Mac) :

```bash
DEPLOY_VPS="root@IP_DU_VPS" \
DEPLOY_REMOTE_DIR="/root/boulangerie" \
DEPLOY_SITE_URL="https://boulangerie.lodene.cloud" \
DEPLOY_KEY="$HOME/.ssh/deploy_key" \
DEPLOY_COMPOSE_PROJECT="boulangerie" \
./deploy/update-production.sh
```

Le script fait : vérifs locales, synchronisation du code, rebuild Docker,
migrations Prisma automatiques, puis vérification `/api/health`.

## Variables

| Variable | Rôle |
| --- | --- |
| `DEPLOY_VPS` | Accès SSH au nouveau serveur, par exemple `user@host` |
| `DEPLOY_REMOTE_DIR` | Dossier du projet sur le serveur |
| `DEPLOY_SITE_URL` | URL publique du nouveau site |
| `DEPLOY_KEY` | Clé SSH à utiliser, optionnelle |
| `DEPLOY_COMPOSE_PROJECT` | Nom du projet Docker Compose, défaut `boulangerie` |

## Vérifications locales

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Notes

- Aucun remote GitHub n'est configuré tant que le nouveau dépôt n'est pas donné.
- Les secrets restent exclus de `rsync` : `.env`, `.env.local`, `.env*.local`.
- Ne lancer le script de déploiement qu'après avoir confirmé le nouveau serveur
  et le nouveau domaine.
