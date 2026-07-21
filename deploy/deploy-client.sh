#!/usr/bin/env bash
#
# Déploiement générique d'UN restaurant (stratégie multi-instance).
#
# Usage :
#   ./deploy/deploy-client.sh <slug>
#
# Charge les paramètres de cible depuis deploy/clients/<slug>.env
# (VPS, dossier distant, domaine, projet Compose, port), puis délègue le
# travail réel à deploy/update-production.sh :
#   vérifs locales (typecheck + lint + build) -> rsync du code
#   -> overlay d'assets propre au client (si présent)
#   -> rebuild Docker (migrations Prisma auto) -> vérification /api/health.
#
# Chaque restaurant est isolé : projet Compose dédié, volume Postgres dédié,
# port dédié, vhost Nginx dédié. Voir MULTI-RESTAURANT.md.
#
# Les variables déjà présentes dans l'environnement priment sur le fichier de
# config (chaque config utilise la forme ${VAR:-défaut}), ce qui permet un
# override ponctuel : DEPLOY_KEY=… ./deploy/deploy-client.sh <slug>

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

SLUG="${1:-}"

list_clients() {
  echo "Clients disponibles :"
  local found=0
  for f in deploy/clients/*.env; do
    [[ -e "$f" ]] || continue
    local name
    name="$(basename "$f" .env)"
    [[ "$name" == "EXEMPLE" ]] && continue
    echo "  - $name"
    found=1
  done
  [[ "$found" == 1 ]] || echo "  (aucun — copie deploy/clients/EXEMPLE.env vers deploy/clients/<slug>.env)"
}

if [[ -z "$SLUG" ]]; then
  echo "Usage : ./deploy/deploy-client.sh <slug>"
  list_clients
  exit 1
fi

CONFIG="deploy/clients/${SLUG}.env"
if [[ ! -r "$CONFIG" ]]; then
  echo "Config client introuvable : $CONFIG"
  echo "Crée-la à partir du modèle :"
  echo "  cp deploy/clients/EXEMPLE.env $CONFIG   # puis renseigne VPS / domaine / port / projet Compose"
  list_clients
  exit 1
fi

# Charge la config (auto-export via set -a). Les valeurs y sont écrites en
# ${VAR:-défaut} : un VAR déjà exporté dans l'environnement est conservé.
set -a
# shellcheck source=/dev/null
source "$CONFIG"
set +a

# Overlay d'assets propre au client (logo, favicon, photos…), appliqué par
# rsync par-dessus l'arbre distant avant le build Docker. Optionnel : ignoré
# si le dossier est absent ou vide.
export DEPLOY_OVERLAY_DIR="${DEPLOY_OVERLAY_DIR:-deploy/clients/${SLUG}/overlay}"

echo "==> Déploiement « $SLUG » -> ${DEPLOY_SITE_URL:-?} (${DEPLOY_VPS:-?})"
exec ./deploy/update-production.sh
