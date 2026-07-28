#!/usr/bin/env bash
#
# Met à jour le site de production depuis ce Mac.
# Usage :
#   DEPLOY_VPS="root@213.130.144.215" \
#   DEPLOY_REMOTE_DIR="/root/restaurant-turc" \
#   DEPLOY_SITE_URL="https://lodene.cloud" \
#   DEPLOY_COMPOSE_PROJECT="restaurant-turc" \
#   ./deploy/update-production.sh
#
# Étapes : vérifs locales (typecheck + lint + build) -> rsync du code
#          -> rebuild Docker (migrations Prisma auto) -> vérification /api/health.
# Voir deploy/MISE-A-JOUR.md pour le détail.
#
# Les commandes distantes utilisent des valeurs déjà échappées avec printf %q.
# shellcheck disable=SC2029

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

SITE_URL="${SITE_URL%/}"

if [[ "$VPS" == *"VOTRE_IP_SERVEUR"* || "$VPS" == *"IP_VPS_HOSTINGER"* || "$SITE_URL" == *"votre-domaine.fr"* ]]; then
  echo "Les placeholders de déploiement n'ont pas été remplacés."
  echo "Renseigne DEPLOY_VPS et DEPLOY_SITE_URL avec l'IP Hostinger et le vrai domaine."
  exit 1
fi

if [[ "$SITE_URL" != https://* ]]; then
  echo "DEPLOY_SITE_URL doit être l'URL HTTPS publique finale."
  exit 1
fi

if [[ ! -r "$KEY" ]]; then
  echo "Clé SSH introuvable ou illisible : $KEY"
  echo "Renseigne DEPLOY_KEY ou installe la clé Hostinger attendue."
  exit 1
fi

# Aller à la racine du repo (le script est dans deploy/)
cd "$(dirname "${BASH_SOURCE[0]}")/.."

printf -v remote_dir_q "%q" "$REMOTE_DIR"
printf -v compose_project_q "%q" "$COMPOSE_PROJECT"

echo "==> 1/5  Vérifications locales (typecheck + lint + build)"
npm run typecheck
npm run lint
npm run build

echo "==> 2/5  Synchronisation du code vers le VPS (rsync)"
# NB : `--delete` efface côté distant tout ce qui n'est pas dans ce dépôt.
# `.data` DOIT rester exclu : c'est le point de montage des médias téléversés
# depuis le CRM (/admin/medias). Sans cette exclusion, chaque mise à jour
# supprimerait les photos ajoutées par le client.
ssh "${SSH_OPTS[@]}" "$VPS" "mkdir -p $remote_dir_q"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  --exclude '.env' --exclude '.env.local' --exclude '.env*.local' \
  --exclude 'docker-compose.override.yml' --exclude 'deploy-build.log' \
  --exclude 'coverage' --exclude '.DS_Store' --exclude '*.tsbuildinfo' \
  --exclude '.data' --exclude '.vercel' \
  ./ "$VPS:$REMOTE_DIR/"

# Overlay d'assets propre au restaurant (logo, favicon, photos…), appliqué
# APRÈS le rsync du code — donc APRÈS le --delete — pour remplacer les assets du
# template et conserver les fichiers présents uniquement dans l'overlay.
# Le contenu de l'overlay reproduit l'arborescence du dépôt (public/…, src/app/…).
if [[ -n "${DEPLOY_OVERLAY_DIR:-}" && -d "$DEPLOY_OVERLAY_DIR" ]] \
  && [[ -n "$(find "$DEPLOY_OVERLAY_DIR" -type f ! -name '.gitkeep' -print -quit)" ]]; then
  echo "==> 2b/5  Overlay d'assets du restaurant ($DEPLOY_OVERLAY_DIR)"
  rsync -az \
    -e "ssh ${SSH_OPTS[*]}" \
    --exclude '.gitkeep' \
    "$DEPLOY_OVERLAY_DIR"/ "$VPS:$REMOTE_DIR/"
else
  echo "==> 2b/5  Pas d'overlay d'assets (assets du template conservés)"
fi

echo "==> 3/5  Vérification du .env distant"
if ! ssh "${SSH_OPTS[@]}" "$VPS" "test -f $remote_dir_q/.env"; then
  echo "Fichier distant manquant : $REMOTE_DIR/.env"
  echo "Crée-le sur le VPS Hostinger depuis le modèle synchronisé, remplis les secrets, puis relance :"
  echo "  ssh -i $KEY $VPS 'cd $REMOTE_DIR && cp .env.production.example .env && nano .env'"
  exit 1
fi

echo "==> 4/5  Rebuild + redéploiement sur le VPS (migrations auto)"
ssh "${SSH_OPTS[@]}" "$VPS" \
  "cd $remote_dir_q && docker compose --env-file .env -p $compose_project_q up -d --build"

echo "==> 5/5  Vérification"
ssh "${SSH_OPTS[@]}" "$VPS" "cd $remote_dir_q && docker compose -p $compose_project_q ps"
printf 'health : '
for _attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs --max-time 10 "$SITE_URL/api/health" 2>/dev/null | grep -q '"db":"up"'; then
    curl -s --max-time 10 "$SITE_URL/api/health"; echo
    echo "✅ Mise à jour terminée — $SITE_URL"
    exit 0
  fi
  sleep 3
done

echo "⚠️  L'app n'a pas répondu 'ok' à temps. Vérifie les logs :"
echo "    ssh -i $KEY $VPS 'cd $REMOTE_DIR && docker compose -p $COMPOSE_PROJECT logs --tail 80 app'"
exit 1
