# AGENTS.md

Instructions pour les agents (Codex, etc.) intervenant sur ce dépôt.
Contexte technique complet : **`CLAUDE.md`**. Déploiement détaillé : **`HOSTINGER.md`**
et **`deploy/MISE-A-JOUR.md`**.

## Projet

Site full-stack de **boulangerie** (vitrine + commande en ligne + back-office) :
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

Ce script (paramètres pré-remplis, surchargables par variables d'env) :
vérifs locales (typecheck + lint) → **rsync** du code vers le VPS → **rebuild
Docker** → **migrations Prisma automatiques** (`prisma migrate deploy` via le
service `migrate`) → vérification `https://boulangerie.lodene.cloud/api/health`.

Le déploiement passe par **rsync**, pas par git.

## ⚠️ Contraintes CRITIQUES — VPS Hostinger PARTAGÉ

Le VPS héberge **aussi** le site « restaurant » (`lodene.cloud`) et d'autres sites.
**NE JAMAIS Y TOUCHER.**

- Accès : `root@213.130.144.215`, clé SSH `~/.ssh/loden_hostinger_ed25519`.
- La boulangerie est **isolée** : projet Docker Compose **`boulangerie`** (toujours
  `docker compose -p boulangerie …`), volume dédié, app exposée sur
  **`127.0.0.1:3200`** uniquement (3000 et 3100 sont déjà pris), fichier Nginx
  `boulangerie`, domaine **`boulangerie.lodene.cloud`**, code dans `/root/boulangerie`.
- **Interdits** : recréer/arrêter les conteneurs `restaurant-*`, utiliser les ports
  3000/3100, modifier les autres fichiers Nginx ou la conf `lodene.cloud`, lancer
  `prisma migrate reset`, ou exécuter `npm run db:seed` en prod (cela injecterait de
  fausses données de démo sur le site réel).
- Le `.env` distant `/root/boulangerie/.env` contient les **secrets** ; il est exclu
  du rsync (non écrasé). Ne pas le régénérer.

## Git

Aucun remote n'est configuré → **ne pas `git push`**. Travailler en local / commits.
