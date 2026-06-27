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
via le service `migrate`) → vérification `https://votre-domaine.fr/api/health`.

Le déploiement passe par **rsync**, pas par git.

## ⚠️ Contraintes CRITIQUES — serveur de production

- Accès : `root@VOTRE_IP_SERVEUR`, clé SSH `~/.ssh/deploy_key` (à renseigner).
- Le restaurant est **isolé** : projet Docker Compose **`restaurant-turc`** (toujours
  `docker compose -p restaurant-turc …`), volume dédié, app exposée sur
  **`127.0.0.1:3200`** uniquement, fichier Nginx `restaurant-turc`, domaine
  **`votre-domaine.fr`**, code dans `/root/restaurant-turc`.
- Si le serveur héberge **d'autres sites**, ne jamais y toucher : ne pas recréer/arrêter
  leurs conteneurs, ne pas réutiliser leurs ports, ne pas modifier leurs fichiers Nginx.
- **Interdits en prod** : `prisma migrate reset`, `npm run db:seed` (cela injecterait de
  fausses données de démo sur le site réel).
- Le `.env` distant `/root/restaurant-turc/.env` contient les **secrets** ; il est exclu
  du rsync (non écrasé). Ne pas le régénérer.

## Git

Aucun remote n'est configuré (nouveau dépôt propre à créer) → **ne pas `git push`**.
Travailler en local.
