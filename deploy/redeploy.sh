#!/usr/bin/env bash
#
# Redéploiement clé en main de la boulangerie sur VPS Hostinger (lodene.cloud).
#
# Usage :
#   ./deploy/redeploy.sh
#
# Renseignez les paramètres du serveur ci-dessous (placeholders à remplacer).
# Ils restent surchargables par variables d'environnement si besoin
# (ex : DEPLOY_KEY=... ./deploy/redeploy.sh).
#
# Le travail réel est fait par deploy/update-production.sh :
#   vérifs locales (typecheck + lint + build) -> rsync -> rebuild Docker
#   -> migrations Prisma auto -> vérification /api/health.
#
# Le site est isolé : projet Compose « boulangerie », port 127.0.0.1:3200,
# fichier Nginx dédié. Le VPS héberge d'autres sites (restaurant, es-viry,
# lodene) — ne pas y toucher.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

export DEPLOY_VPS="${DEPLOY_VPS:-root@213.130.144.215}"
export DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/root/boulangerie}"
export DEPLOY_SITE_URL="${DEPLOY_SITE_URL:-https://lodene.org}"
export DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/deploy_key}"
export DEPLOY_COMPOSE_PROJECT="${DEPLOY_COMPOSE_PROJECT:-boulangerie}"

echo "==> Redéploiement boulangerie -> $DEPLOY_SITE_URL ($DEPLOY_VPS)"
exec ./deploy/update-production.sh
