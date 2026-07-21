#!/usr/bin/env bash
#
# Redéploiement clé en main d'Anatolia Grill sur le VPS Hostinger.
#
# Usage :
#   ./deploy/redeploy.sh
#
# Alias de rétro-compatibilité : équivaut désormais à
#   ./deploy/deploy-client.sh anatolia-grill
# (les paramètres de production vivent dans deploy/clients/anatolia-grill.env).
#
# Pour déployer un AUTRE restaurant, utiliser directement :
#   ./deploy/deploy-client.sh <slug>
# Voir MULTI-RESTAURANT.md.
#
# Les overrides par variable d'environnement restent possibles :
#   DEPLOY_KEY=… ./deploy/redeploy.sh

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

exec ./deploy/deploy-client.sh anatolia-grill
