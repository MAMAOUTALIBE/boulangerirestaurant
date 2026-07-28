# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- Dépendances ----
FROM base AS deps
COPY package.json package-lock.json ./
# --ignore-scripts : le postinstall (prisma generate) requiert le schéma,
# copié seulement au stage build. La génération a lieu dans `npm run build`.
RUN npm ci --ignore-scripts

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER=
ARG NEXT_PUBLIC_TELEGRAM_ORDER_USERNAME=
ARG NEXT_PUBLIC_FACEBOOK_URL=
ARG NEXT_PUBLIC_INSTAGRAM_URL=
ARG NEXT_PUBLIC_TIKTOK_URL=
ARG NEXT_PUBLIC_TELEGRAM_URL=
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER=$NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER
ENV NEXT_PUBLIC_TELEGRAM_ORDER_USERNAME=$NEXT_PUBLIC_TELEGRAM_ORDER_USERNAME
ENV NEXT_PUBLIC_FACEBOOK_URL=$NEXT_PUBLIC_FACEBOOK_URL
ENV NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL
ENV NEXT_PUBLIC_TIKTOK_URL=$NEXT_PUBLIC_TIKTOK_URL
ENV NEXT_PUBLIC_TELEGRAM_URL=$NEXT_PUBLIC_TELEGRAM_URL
# `build` = prisma generate && next build (sortie standalone)
RUN npm run build

# ---- Runner (image finale, légère) ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# App Next.js autonome (le trace standalone inclut @prisma/client + moteur)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Sécurité : moteur Prisma + client générés (au cas où le trace ne les inclut pas).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Point de montage des médias téléversés depuis le CRM (volume nommé « uploads »
# en production). Créé et donné à `nextjs` AVANT le changement d'utilisateur :
# un volume Docker hérite des droits du dossier présent dans l'image, sinon
# l'app tournerait sans droit d'écriture dessus.
RUN mkdir -p /app/.data/uploads && chown -R nextjs:nodejs /app/.data

USER nextjs
EXPOSE 3000
# Les migrations sont appliquées par le service « migrate » (image complète).
CMD ["node", "server.js"]
