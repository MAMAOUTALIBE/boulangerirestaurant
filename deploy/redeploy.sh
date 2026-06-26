#!/usr/bin/env bash
#
# Redéploiement clé en main du restaurant turc (votre-domaine.fr).
#
# Usage :
#   ./deploy/redeploy.sh
#
# Renseignez les paramètres du serveur ci-dessous (placeholders à remplacer).
# Ils restent surchargables par variables d'environnement si besoin
# (ex : DEPLOY_KEY=... ./deploy/redeploy.sh).
#
# Le travail réel est fait par deploy/update-production.sh :
#   vérifs locales (typecheck + lint) -> rsync -> rebuild Docker
#   -> migrations Prisma auto -> vérification /api/health.
#
# Le restaurant est isolé : projet Compose « restaurant-turc », port 3200,
# fichier Nginx dédié. Si le serveur héberge d'autres sites, ne pas y toucher.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

export DEPLOY_VPS="${DEPLOY_VPS:-root@VOTRE_IP_SERVEUR}"
export DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/root/restaurant-turc}"
export DEPLOY_SITE_URL="${DEPLOY_SITE_URL:-https://votre-domaine.fr}"
export DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/deploy_key}"
export DEPLOY_COMPOSE_PROJECT="${DEPLOY_COMPOSE_PROJECT:-restaurant-turc}"

echo "==> Redéploiement restaurant turc -> $DEPLOY_SITE_URL ($DEPLOY_VPS)"
exec ./deploy/update-production.sh
