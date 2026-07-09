#!/usr/bin/env bash
#
# Redéploiement clé en main d'Anatolia Grill sur le VPS Hostinger.
#
# Usage :
#   ./deploy/redeploy.sh
#
# Les paramètres ci-dessous correspondent à la production actuelle.
# Ils restent surchargeables par variables d'environnement si besoin
# (ex : DEPLOY_KEY=... ./deploy/redeploy.sh).
#
# Le travail réel est fait par deploy/update-production.sh :
#   vérifs locales (typecheck + lint + build) -> rsync -> rebuild Docker
#   -> migrations Prisma auto -> vérification /api/health.
#
# Le site est isolé : projet Compose « restaurant-turc », port
# 127.0.0.1:3201, vhost Nginx « lodene.cloud ». Le VPS héberge d'autres
# sites (boulangerie/lodene.org, restaurant historique, es-viry, lodene.fr) :
# ne pas y toucher.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

export DEPLOY_VPS="${DEPLOY_VPS:-root@213.130.144.215}"
export DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/root/restaurant-turc}"
export DEPLOY_SITE_URL="${DEPLOY_SITE_URL:-https://lodene.cloud}"
export DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/deploy_key}"
export DEPLOY_COMPOSE_PROJECT="${DEPLOY_COMPOSE_PROJECT:-restaurant-turc}"

echo "==> Redéploiement Anatolia Grill -> $DEPLOY_SITE_URL ($DEPLOY_VPS)"
exec ./deploy/update-production.sh
