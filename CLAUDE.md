# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack Turkish restaurant website (showcase + online ordering + admin CRM) built with **Next.js 16 (App Router)**, TypeScript (strict), PostgreSQL via **Prisma 6**, Zod, Tailwind 3, and Framer Motion. The codebase, UI, comments, commit messages, and order-status strings are all in **French** — match that language when editing.

Important Git note: this local project was adapted from a restaurant base and is now
the **Anatolia Grill** site (npm package name `restaurant-turc`). The GitHub remote
`origin` (`MAMAOUTALIBE/boulangerirestaurant`) holds **source history only** — the live
server is updated by rsync, not `git pull` (see Deployment). Commit/push only when asked.

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
npm run db:seed      # tsx prisma/seed.ts — applies a SEED PROFILE (default anatolia-grill)
SEED_PROFILE=blank npm run db:seed   # skeleton profile for a new restaurant (see below)
npm run db:studio    # prisma studio
```

A running PostgreSQL instance and `DATABASE_URL` are **required** even for local dev — dishes, menu, orders, and most pages read from the DB, not from static files. Copy `.env.example` → `.env.local` to start. After cloning: `npm install` (runs `prisma generate` via postinstall) → `npm run db:migrate` → `npm run db:seed`.

> The `build` script produces Next.js `standalone` output and then manually copies `public/` and `.next/static` into `.next/standalone`. Production is served with `npm start` (Docker/VPS) — not `next start`.

## Architecture

### Layers

- **Server Actions** (`src/app/actions.ts`) are the primary mutation entry point — every form posts to one. They follow a fixed pattern: honeypot bot check (`isBot`) → `rateLimit(...)` → Zod `safeParse` → call a `src/lib/*` function → `revalidatePath`/`redirect`. Admin actions are prefixed `admin*` and re-check `isAdminEmail`.
- **Domain logic** lives in `src/lib/*.ts`, each file marked `import "server-only"` (orders, payment, auth, customers, promo, delivery, loyalty, slots, reviews, segmentation, stripe-connect, email, sms, assistant, demo-leads, marketing-automation, testers, plus restaurant features: `stock`, `seasonal`, `antiwaste`, `service-alert`, `social-order`…). Keep business rules here, not in components or routes. A few helpers are deliberately **pure / framework-free** (no `server-only`, no DB) so they can be unit-tested in isolation — `stock.ts`, `service-alert.ts`, `social-order.ts`, `analytics.ts`, `segmentation.ts`, `validation.ts`, `utils.ts`, `marketing-rules.ts`, `payment-integrity.ts`, `site-activity.ts` (see their colocated `*.test.ts`; `analytics.ts` powers the revenue forecast + peak-hours heatmap on `/admin/rapports`). A pure helper is typically the framework-free half of a `server-only` module that does the DB read (`marketing-rules`↔`marketing-automation`, `site-activity`↔`testers`).
- **API routes** (`src/app/api/*`) serve JSON/CSV and webhooks. The Stripe webhook (`/api/webhooks/stripe`) is the **source of truth** for payment confirmation (reads the raw body to verify the signature) — the browser redirect is not trusted. Before marking an order `payée`, the pure `payment-integrity.ts` (`isExpectedStripePayment`, `amountInCents`) re-checks that Stripe's confirmed amount/currency/status match what was expected — Stripe's figures are verified, not trusted.
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

### Demo-lead capture (`demo-leads.ts`, `/admin/leads`, `DemoLead`)

A cross-cutting **lead tracker** layered on top of the public forms for demo/prospecting: most Server Actions call `recordDemoLead({ source, … })` (newsletter, panier, commande, réservation, contact, traiteur, sur-mesure, saison, anti-gaspi) after their real work. It upserts a `DemoLead` (dedup + `visits` counter + `converted` flag) so `/admin/leads` shows who interacted and from where. Fire-and-forget — it must never block or fail the underlying action. When adding a new public form, mirror the pattern with the appropriate `DemoLeadSource`.

**"Qui teste le site"** (`/admin/tests`) is a second, richer view of the same question: the pure `site-activity.ts` (`aggregateTesters` / `filterTesters`) groups every trace left on the site **by person** — `DemoLead`s, abandoned carts (`AbandonedCart`, captured via `/api/cart`), and `Order`s of **all** statuses (incl. `en attente`/`annulée`) — into a `contact → panier → commande` funnel. `testers.ts` is the `server-only` DB-reading half; it drops redundant `panier`/`commande` leads in favour of the real carts/orders. Read-only — it never mutates.

### Marketing automation (`marketing-automation.ts` + pure `marketing-rules.ts`, `/admin/marketing`)

Rule-based re-engagement emails, models `MarketingRule` / `MarketingCampaign` / `MarketingDispatch`. `ensureMarketingRules` seeds `DEFAULT_MARKETING_RULES` (birthday, inactivity, weather-based); the pure `marketing-rules.ts` holds the trigger predicates (`birthdayMatches`, `isInactiveForDays`, `classifyWeather`, `periodKey`). `runMarketingAutomations()` evaluates every active rule and sends via `sendEmail`, recording a `MarketingDispatch` per recipient so a rule fires **at most once per period** (`periodKey` dedup). It is invoked by the `/api/cron/reengage` cron (see Deployment), and `/admin/marketing` can also dispatch a one-off campaign (`dispatchMarketingCampaign`) and shows the `marketingDashboard`.

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
- Theme colors are centralized in `tailwind.config.ts` (`ink`, `cream`, `gold`, `forest`, `muted`) — use these tokens, not raw hex. Those tokens resolve to CSS variables whose accent (`gold`/`forest`) is swapped at runtime by the **CRM-chosen palette**: `OrderingSetting.colorPalette` (`ambre` | `terracotta` | `emeraude`, set from `/admin/parametres`) is read in `src/app/layout.tsx` and written as `data-color-palette` on `:root`, which `globals.css` maps to overrides. Don't hard-code accent hex — add a palette variant in `globals.css` instead.
- Site identity (name, shortName, description, contact phone/email/address/city, hours summary, socials/WhatsApp/Telegram) is **DB-backed and admin-editable** from `/admin/parametres` (see below) — never hard-code these. `contact.city` is the standalone town shown for local delivery/pickup/SEO (Hero, PracticalInfo, commander, QRCode, menu SEO, address-form placeholders) — use it instead of hard-coding the town anywhere. `src/lib/config.ts` holds only the `defaultSiteConfig` fallback + the `SiteConfig` type + pure helpers (`buildContactLinks`, `whatsappUrl`, `telegramUrl`); it has no static `siteConfig` export anymore. Overrides persist as the **`SiteSetting`** singleton (id `"default"`, every column nullable → blank falls back to the default) via the `adminUpdateSiteIdentity` action, which `revalidatePath("/", "layout")` so changes show immediately. Read the effective identity via **`getSiteConfig()`** from `@/lib/site-settings` in server code (React-`cache`d per request; merges the row over `defaultSiteConfig`) or **`useSiteConfig()`** from `@/context/SiteConfigContext` in client components (the root `layout.tsx` reads it once and feeds the provider). Pure/client-safe modules that can't reach the DB (e.g. `social-order.ts`) take the values as parameters defaulting to `defaultSiteConfig`. Technical fields (`url`, `locale`, `currency`, `priceRange`) stay env/code-driven.
- Money is rounded with the `roundCurrency` helper (cents precision); don't introduce float drift.

## Deployment

Vercel (`vercel.json`: build runs `prisma migrate deploy`, region `cdg1`, weekly re-engagement cron at `/api/cron/reengage` — runs `runMarketingAutomations`, protected by `CRON_SECRET`, which returns 503 until the secret is set) or Docker/VPS (`Dockerfile`, `docker-compose.yml`). See `DEPLOYMENT.md` and `DEPLOIEMENT-VPS.md`. Security headers are set in `next.config.mjs` (CSP intentionally omitted to avoid breaking Stripe/JSON-LD).

Production target is a **VPS** at `root@213.130.144.215` for `https://lodene.cloud`: keep Anatolia Grill isolated under Compose project `restaurant-turc` (`docker compose -p restaurant-turc …`), dedicated `restaurant-turc_pgdata` volume, app published on `127.0.0.1:3201` only, and the `lodene.cloud` Nginx vhost. If the server hosts other sites, don't touch them (`lodene.org`/boulangerie is on `3101`, the older restaurant app is on `3100`, es-viry is on `8090`). Full first-deploy guide in `DEPLOIEMENT-VPS.md`; `deploy/nginx.conf` is the reverse-proxy config (proxies to 3201).

Updates run from the Mac. The generic entry point is **`./deploy/deploy-client.sh <slug>`** — it sources the target params from `deploy/clients/<slug>.env` (VPS, remote dir, site URL, Compose project, host port), applies the client's optional asset overlay (`deploy/clients/<slug>/overlay/`), and `exec`s `deploy/update-production.sh`, the env-var-driven script (`DEPLOY_VPS`, `DEPLOY_REMOTE_DIR`, `DEPLOY_SITE_URL`, `DEPLOY_KEY`, `DEPLOY_COMPOSE_PROJECT`, `DEPLOY_OVERLAY_DIR`) that does local checks (typecheck + lint + build) → rsync (excluding `.env*`, so the remote secrets file is never overwritten) → overlay rsync → Docker rebuild → Prisma `migrate deploy` → `/api/health` check (see `deploy/MISE-A-JOUR.md`). `./deploy/redeploy.sh` is a backwards-compatible alias for `./deploy/deploy-client.sh anatolia-grill`. Deploy is over **rsync, not git pull**; GitHub is for source history, not the live server checkout.

### Multi-restaurant (same code, N deployments)

The same codebase serves multiple restaurants via **multi-instance** isolation (one Compose project + DB volume + port + Nginx vhost per restaurant). Full guide: **`MULTI-RESTAURANT.md`**. Key pieces: per-target config in `deploy/clients/<slug>.env` (+ `PORTS.md` registry, `EXEMPLE.env` template), remote secrets template `.env.client.example`, per-restaurant asset overlays `deploy/clients/<slug>/overlay/` (gitignored media, rsync'd over the tree before build), Nginx template `deploy/nginx.template.conf`. Initial content comes from a **seed profile**: `prisma/seed.ts` is a generic runner picking `prisma/seeds/<slug>.ts` via `SEED_PROFILE` (registry `PROFILES`, default `anatolia-grill`). Profiles carry `resetStrategy`: `"demo"` (anatolia only — destructive, deactivates other restaurants/dishes/promos) vs `"additive"` (upsert-only, safe for provisioning a real client). Provision a new client's remote DB once with `docker compose -p <slug> --env-file .env run --rm -e SEED_PROFILE=<slug> migrate node_modules/.bin/tsx prisma/seed.ts` — never run the `anatolia-grill`/demo profile or `prisma migrate reset` in prod.

Sibling instructions file: `AGENTS.md` (for non-Claude agents) restates the deploy command and the production constraints in French — never run `npm run db:seed` or `prisma migrate reset` in prod; if the server hosts other sites, never touch their containers or ports.
