# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack Turkish restaurant website (showcase + online ordering + admin CRM) built with **Next.js 16 (App Router)**, TypeScript (strict), PostgreSQL via **Prisma 6**, Zod, Tailwind 3, and Framer Motion. The codebase, UI, comments, commit messages, and order-status strings are all in **French** — match that language when editing.

Important Git note: this local project was adapted from a restaurant base. No git
remote is configured (a fresh, clean repository is to be created) — do not push
until the new restaurant GitHub remote is explicitly set up.

## Commands

```bash
npm run dev          # dev server on 0.0.0.0:3000
npm run build        # prisma generate + next build + assemble standalone output
npm run start        # serve the standalone production build (node .next/standalone/server.js)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run format       # prettier --write "src/**/*.{ts,tsx,css}"
npm test             # vitest run (one shot)
npm run test:watch   # vitest watch

# A single test file / test name:
npx vitest run src/lib/validation.test.ts
npx vitest run -t "applies a percent promo"

# Database (Prisma):
npm run db:migrate   # prisma migrate dev (apply + create migration in dev)
npm run db:seed      # tsx prisma/seed.ts (categories, products, options, hours, establishment…)
npm run db:studio    # prisma studio
```

A running PostgreSQL instance and `DATABASE_URL` are **required** even for local dev — dishes, menu, orders, and most pages read from the DB, not from static files. Copy `.env.example` → `.env.local` to start. After cloning: `npm install` (runs `prisma generate` via postinstall) → `npm run db:migrate` → `npm run db:seed`.

> The `build` script produces Next.js `standalone` output and then manually copies `public/` and `.next/static` into `.next/standalone`. Production is served with `npm start` (Docker/VPS) — not `next start`.

## Architecture

### Layers

- **Server Actions** (`src/app/actions.ts`) are the primary mutation entry point — every form posts to one. They follow a fixed pattern: honeypot bot check (`isBot`) → `rateLimit(...)` → Zod `safeParse` → call a `src/lib/*` function → `revalidatePath`/`redirect`. Admin actions are prefixed `admin*` and re-check `isAdminEmail`.
- **Domain logic** lives in `src/lib/*.ts`, each file marked `import "server-only"` (orders, payment, auth, customers, promo, delivery, loyalty, slots, reviews, segmentation, stripe-connect, email, sms, assistant, plus restaurant features: `stock`, `seasonal`, `antiwaste`, `service-alert`, `social-order`…). Keep business rules here, not in components or routes. A few helpers are deliberately **pure / framework-free** (no `server-only`, no DB) so they can be unit-tested in isolation — `stock.ts`, `service-alert.ts`, `social-order.ts` (see their colocated `*.test.ts`).
- **API routes** (`src/app/api/*`) serve JSON/CSV and webhooks. The Stripe webhook (`/api/webhooks/stripe`) is the **source of truth** for payment confirmation (reads the raw body to verify the signature) — the browser redirect is not trusted.
- **Prisma client** is a `globalThis` singleton (`src/lib/prisma.ts`) to survive dev hot-reload.

### Data model notes (`prisma/schema.prisma`)

- Menu data (`Category`, `Dish`, `OptionGroup`, `Option`) lives in the DB and is editable from `/admin/menu`. `src/data/*.ts` are **legacy mock files**; the live source is the DB via `src/lib/dishes.ts`. The app-level `Dish.id` maps to the DB `slug` (stable), not the cuid. Queries use `distinct: ["slug"]` because slugs can be duplicated by historical data.
- `Order` has a French status string machine (`OrderStatus` in `src/types/index.ts`): `en attente → payée → en préparation → prête → en livraison → livrée → annulée`. Every transition is audited in `OrderEvent`. Loyalty points are awarded idempotently when status becomes `payée` (`pointsAwarded` flag). Order references look like `NK-<base36>`.
- Multi-restaurant: orders attach to a default `Restaurant` (chosen by `DEFAULT_RESTAURANT_SLUG`, see `src/lib/restaurants.ts`); Stripe **Connect** routes funds to that restaurant's account via `transfer_data` (`src/lib/stripe-connect.ts`, `src/lib/payment.ts`).
- **Naming**: the product is a restaurant. The schema keeps generic restaurant-era model names — `Restaurant` (= établissement), `Dish` (= plat), `Driver`.

### Restaurant features

Four self-contained features, each with a `src/lib` module, a public route, an `/admin` route, and (for three of them) their own Prisma models. The latter three are **paid at pickup** (a `paid` flag on the reservation, not Stripe) — they reserve a quota, they don't run checkout.

- **Stock du jour** (`stock.ts`, no new model): adds `dailyStock` / `soldToday` / `stockDate` to `Dish`. `remainingStock` does a **lazy daily reset** — `soldToday` is ignored unless `stockDate === stockToday()` (today in `Europe/Paris`, `AAAA-MM-JJ`). `null` `dailyStock` = unlimited. Drives the "épuisé" badge and caps cart quantities.
- **Demandes sur-mesure** (`/sur-mesure`, `/admin/sur-mesure`, `CustomRequest`): quote requests for group menus and sharing platters, status machine `nouveau → devis envoyé → confirmé → prêt → récupéré → annulé`.
- **Précommandes de saison** (`seasonal.ts`, `/boutique-de-saison`, `/admin/saison`, `SeasonalProduct` + `SeasonalPreorder`): quota-limited preorders (baklava platters, festive menus…) with a sales window (`salesStart/End`) and a pickup window. `remaining = quota − sold`. Throws `SeasonalError` on closed window / sold out.
- **Paniers anti-gaspi** (`antiwaste.ts`, `/anti-gaspi`, `/admin/paniers`, `AntiWasteOffer` + `AntiWasteReservation`): one surprise-basket offer **per day** (`date` is `@unique`), `remaining = quantity − sold`, throws `AntiWasteError`. Admin manages today's offer.

### Lead-capture features without a `src/lib` module

**Réservation** and **traiteur** have **no dedicated domain module** — their logic lives inline in `src/app/actions.ts` (`createReservation`, `requestCatering`) which Zod-validates then calls `prisma.reservation.create` / `prisma.cateringRequest.create` directly, plus an admin-notification email. Treat them as simple request inboxes, not quota/state machines.

- **Réservations** (`/reservation`, `/admin/reservations`, `Reservation`): table/event booking requests.
- **Traiteur** (`/traiteur`, `/admin/traiteur`, `CateringRequest`): catering quote requests.
- **Galerie** (`/galerie`, no model, no lib): static showcase. The media list is **hard-coded inline** in `src/components/GallerySection.tsx` (a 3-card carousel) referencing files under `public/images` and `public/videos` — to add a photo/video, edit that array (instructions are in a comment at the top of the file), don't look for a DB or admin screen.

### Admin screens beyond CRUD

`/admin/service` is a **kitchen/service board** (`src/components/admin/ServiceBoard.tsx`) that ranks live orders by urgency via the pure `computeServiceAlert` (`service-alert.ts`): levels `ok < imminent < stagnant < late`, computed from the order's due time (chosen slot, else creation + `Dish.prepMinutes`) and time-in-current-status. `/admin/recap` is a daily summary. Other admin sections mirror the features above (`anti-gaspi`/`paniers`, `sur-mesure`, `saison`).

Admin navigation is centralized in `src/components/admin/AdminSidebar.tsx`: ~8 primary links are always visible, the rest are folded into two collapsible groups ("Ventes spéciales", "Marketing & rapports"); open/closed state persists to `localStorage` (`crm-sidebar-groups`). On mobile the groups flatten into a horizontal scroll bar. Add new admin sections to the right list there.

### Social order fallback (`social-order.ts`)

When checkout can't complete (e.g. no payment configured), the cart can be sent as a pre-filled **WhatsApp or Telegram message** — `formatSocialOrderMessage` builds the text, `buildWhatsAppOrderUrl` / `buildTelegramOrderUrl` build the deep links, and the checkout page (`/commander`) opens `wa.me` / `t.me`. Pure/testable, no server dependency.

### Auth & sessions (`src/lib/session.ts`, `src/lib/auth.ts`)

- Passwordless. Customers log in via **magic link** (single-use `VerificationToken`, 15 min TTL). Admins log in via the `ADMIN_EMAILS` allowlist + `ADMIN_PASSWORD` (timing-safe compare).
- The session is just the user's email, stored in an **HMAC-signed cookie** (`SESSION_SECRET`). `src/app/admin/layout.tsx` is the single access guard for all `/admin/*` routes (`force-dynamic`, redirects non-admins to `/compte`).

### Graceful-degradation pattern (important & pervasive)

Optional integrations fall back to a working "simulation" mode when their env keys are absent. Preserve this when touching these areas:

- **Stripe** missing → `startCheckout` returns `{ simulated: true }`, app confirms locally.
- **Resend** (`src/lib/email.ts`) missing → logs the email to console.
- **Twilio** (`src/lib/sms.ts`) missing → logs the SMS to console.
- **Assistant LLM** (`ASSISTANT_API_KEY`, OpenAI-compatible, default Groq) missing or failing → `ruleBasedAnswer` keyword fallback. The assistant validates/re-resolves prices and actions server-side (`resolveActions`) against a whitelist — never trust the model's prices or links.
- **Upstash Redis** (`src/lib/rate-limit.ts`) missing → in-memory per-instance bucket (fine for single-instance, replace for multi-instance prod).

When a new order lands, `notifyOrderChannels` (`src/lib/order-notifications.ts`, called from the `placeOrder` action + `/api/orders`) fans an **admin** alert out across WhatsApp, Telegram, and SMS in parallel — each channel independently no-ops (logs only) when its env keys are missing, so a misconfigured channel never blocks the others or the order. This is distinct from the customer-facing social-order fallback above.

### Client state & i18n

- Cart, order, and language are React Contexts in `src/context/` (`CartContext` persists to `localStorage`; cart lines are keyed by a composite `lineId` of dish + options + note). i18n is a small fr/en dictionary (`src/lib/i18n.ts`) driven by `LangContext`.

## Conventions

- Path alias `@/*` → `src/*`.
- Prettier: double quotes, semicolons, trailing commas, 80 cols, `prettier-plugin-tailwindcss` (keep Tailwind class order). Run `npm run format` before finishing.
- Tests are Vitest + Testing Library (`jsdom`), colocated as `*.test.ts(x)`. The Vitest setup clears `localStorage` after each test.
- Theme colors are centralized in `tailwind.config.ts` (`ink`, `cream`, `gold`, `forest`, `muted`) — use these tokens, not raw hex.
- Money is rounded with the `roundCurrency` helper (cents precision); don't introduce float drift.

## Deployment

Vercel (`vercel.json`: build runs `prisma migrate deploy`, region `cdg1`, weekly re-engagement cron at `/api/cron/reengage` protected by `CRON_SECRET`) or Docker/VPS (`Dockerfile`, `docker-compose.yml`). See `DEPLOYMENT.md` and `DEPLOIEMENT-VPS.md`. Security headers are set in `next.config.mjs` (CSP intentionally omitted to avoid breaking Stripe/JSON-LD).

Production target is a **VPS** at `root@213.130.144.215` for `https://lodene.cloud`: keep Anatolia Grill isolated under Compose project `restaurant-turc` (`docker compose -p restaurant-turc …`), dedicated `restaurant-turc_pgdata` volume, app published on `127.0.0.1:3201` only, and the `lodene.cloud` Nginx vhost. If the server hosts other sites, don't touch them (`lodene.org`/boulangerie is on `3101`, the older restaurant app is on `3100`, es-viry is on `8090`). Full first-deploy guide in `DEPLOIEMENT-VPS.md`; `deploy/nginx.conf` is the reverse-proxy config (proxies to 3201).

Updates run from the Mac. The turnkey entry point is **`./deploy/redeploy.sh`** — a thin wrapper that pre-fills the production params (`/root/restaurant-turc`, `https://lodene.cloud`, Compose project `restaurant-turc`) and `exec`s `deploy/update-production.sh`, the env-var-driven script (`DEPLOY_VPS`, `DEPLOY_REMOTE_DIR`, `DEPLOY_SITE_URL`, `DEPLOY_KEY`, `DEPLOY_COMPOSE_PROJECT=restaurant-turc`) that does local checks (typecheck + lint + build) → rsync (excluding `.env*`, so the remote secrets file is never overwritten) → Docker rebuild → Prisma `migrate deploy` → `/api/health` check (see `deploy/MISE-A-JOUR.md`). Deploy is over **rsync, not git pull**; GitHub is for source history, not the live server checkout.

Sibling instructions file: `AGENTS.md` (for non-Claude agents) restates the deploy command and the production constraints in French — never run `npm run db:seed` or `prisma migrate reset` in prod; if the server hosts other sites, never touch their containers or ports.
