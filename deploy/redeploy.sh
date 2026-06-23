#!/usr/bin/env bash
#
# Redéploiement clé en main de la boulangerie (boulangerie.lodene.cloud).
#
# Usage :
#   ./deploy/redeploy.sh
#
# Tous les paramètres du VPS Hostinger partagé sont pré-remplis ci-dessous.
# Ils restent surchargables par variables d'environnement si besoin
# (ex : DEPLOY_KEY=... ./deploy/redeploy.sh).
#
# Le travail réel est fait par deploy/update-production.sh :
#   vérifs locales (typecheck + lint) -> rsync -> rebuild Docker
#   -> migrations Prisma auto -> vérification /api/health.
#
# IMPORTANT : VPS PARTAGÉ. Ne jamais toucher au site « restaurant » (lodene.cloud,
# conteneurs restaurant-*, port 3100) ni aux autres sites. La boulangerie est
# isolée : projet Compose « boulangerie », port 3200, fichier Nginx dédié.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

export DEPLOY_VPS="${DEPLOY_VPS:-root@213.130.144.215}"
export DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/root/boulangerie}"
export DEPLOY_SITE_URL="${DEPLOY_SITE_URL:-https://boulangerie.lodene.cloud}"
export DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/loden_hostinger_ed25519}"
export DEPLOY_COMPOSE_PROJECT="${DEPLOY_COMPOSE_PROJECT:-boulangerie}"

echo "==> Redéploiement boulangerie -> $DEPLOY_SITE_URL ($DEPLOY_VPS)"
exec ./deploy/update-production.sh
