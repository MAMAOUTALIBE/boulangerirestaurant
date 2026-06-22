# Mettre à jour le site en ligne

Runbook générique pour le futur hébergement de la boulangerie.

L'ancien domaine et l'ancien serveur ne sont plus configurés dans ce projet.
Avant un déploiement, renseigner les variables du nouveau serveur.

## Méthode rapide

Depuis la racine du projet :

```bash
DEPLOY_VPS="user@host" \
DEPLOY_REMOTE_DIR="/chemin/projet" \
DEPLOY_SITE_URL="https://nouveau-domaine.fr" \
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
