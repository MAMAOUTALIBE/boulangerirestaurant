#!/usr/bin/env bash
#
# Met à jour le site de production depuis ce Mac.
# Usage :
#   DEPLOY_VPS="user@host" \
#   DEPLOY_REMOTE_DIR="/chemin/projet" \
#   DEPLOY_SITE_URL="https://nouveau-domaine.fr" \
#   ./deploy/update-production.sh
#
# Étapes : vérifs locales (typecheck + lint) -> rsync du code -> rebuild Docker
#          (migrations Prisma auto) -> vérification /api/health.
# Voir deploy/MISE-A-JOUR.md pour le détail.

set -euo pipefail

# ---- Config ----
VPS="${DEPLOY_VPS:-}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/deploy_key}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-}"
SITE_URL="${DEPLOY_SITE_URL:-}"
COMPOSE_PROJECT="${DEPLOY_COMPOSE_PROJECT:-restaurant-turc}"
SSH_OPTS=(-i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)

missing=()
[[ -n "$VPS" ]] || missing+=("DEPLOY_VPS")
[[ -n "$REMOTE_DIR" ]] || missing+=("DEPLOY_REMOTE_DIR")
[[ -n "$SITE_URL" ]] || missing+=("DEPLOY_SITE_URL")

if (( ${#missing[@]} > 0 )); then
  echo "Configuration de production manquante : ${missing[*]}"
  echo "Renseigne ces variables avant de lancer le script."
  exit 1
fi

# Aller à la racine du repo (le script est dans deploy/)
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "==> 1/4  Vérifications locales (typecheck + lint)"
npm run typecheck
npm run lint

echo "==> 2/4  Synchronisation du code vers le VPS (rsync)"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  --exclude '.env' --exclude '.env.local' --exclude '.env*.local' \
  --exclude 'docker-compose.override.yml' --exclude 'deploy-build.log' \
  --exclude 'coverage' --exclude '.DS_Store' --exclude '*.tsbuildinfo' \
  --exclude '.data' --exclude '.vercel' \
  ./ "$VPS:$REMOTE_DIR/"

echo "==> 3/4  Rebuild + redéploiement sur le VPS (migrations auto)"
ssh "${SSH_OPTS[@]}" "$VPS" \
  "cd $REMOTE_DIR && docker compose --env-file .env -p $COMPOSE_PROJECT up -d --build"

echo "==> 4/4  Vérification"
ssh "${SSH_OPTS[@]}" "$VPS" "docker compose -p $COMPOSE_PROJECT ps"
printf 'health : '
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs --max-time 10 "$SITE_URL/api/health" 2>/dev/null | grep -q '"db":"up"'; then
    curl -s --max-time 10 "$SITE_URL/api/health"; echo
    echo "✅ Mise à jour terminée — $SITE_URL"
    exit 0
  fi
  sleep 3
done

echo "⚠️  L'app n'a pas répondu 'ok' à temps. Vérifie les logs :"
echo "    ssh ${SSH_OPTS[*]} $VPS 'docker logs --tail 80 ${COMPOSE_PROJECT}-app-1'"
exit 1
