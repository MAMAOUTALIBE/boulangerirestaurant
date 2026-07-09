# AGENTS.md

Instructions pour les agents (Codex, etc.) intervenant sur ce dépôt.
Contexte technique complet : **`CLAUDE.md`**. Déploiement détaillé : **`DEPLOIEMENT-VPS.md`**
et **`deploy/MISE-A-JOUR.md`**.

## Projet

Site full-stack de **restaurant turc** (vitrine + commande en ligne + back-office) :
Next.js 16 (App Router), TypeScript strict, PostgreSQL via Prisma 6, Tailwind.
Le code, l'UI et les commits sont en **français** — garder cette langue.

## Vérifications avant tout déploiement

```bash
npm run typecheck && npm run lint && npm run build
```

## Redéploiement en production — une seule commande

```bash
./deploy/redeploy.sh
```

Ce script (paramètres à renseigner, surchargables par variables d'env) :
vérifs locales (typecheck + lint + build) → **rsync** du code vers le serveur →
**rebuild Docker** → **migrations Prisma automatiques** (`prisma migrate deploy`
via le service `migrate`) → vérification `https://lodene.cloud/api/health`.

Le déploiement passe par **rsync**, pas par git.

## ⚠️ Contraintes CRITIQUES — serveur de production

- Accès : `root@213.130.144.215`, clé SSH `~/.ssh/deploy_key`.
- Le restaurant est **isolé** : projet Docker Compose **`restaurant-turc`** (toujours
  `docker compose -p restaurant-turc …`), volume dédié, app exposée sur
  **`127.0.0.1:3201`** uniquement, vhost Nginx `lodene.cloud`, domaine
  **`lodene.cloud`**, code dans `/root/restaurant-turc`.
- Les autres apps du VPS sont séparées : `lodene.org`/boulangerie utilise
  `127.0.0.1:3101`, l'ancien restaurant utilise `127.0.0.1:3100`, et es-viry
  utilise `127.0.0.1:8090`.
- Si le serveur héberge **d'autres sites**, ne jamais y toucher : ne pas recréer/arrêter
  leurs conteneurs, ne pas réutiliser leurs ports, ne pas modifier leurs fichiers Nginx.
- **Interdits en prod** : `prisma migrate reset`, `npm run db:seed` (cela injecterait de
  fausses données de démo sur le site réel).
- Le `.env` distant `/root/restaurant-turc/.env` contient les **secrets** ; il est exclu
  du rsync (non écrasé). Ne pas le régénérer.

## Git

Le dépôt GitHub est configuré (`origin`). Les mises à jour applicatives peuvent
être poussées sur GitHub après validation, mais la production ne fait pas de
`git pull` : le déploiement VPS reste `rsync` + Docker via `./deploy/redeploy.sh`.
