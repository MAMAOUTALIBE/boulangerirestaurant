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

- Menu data (`Category`, `Dish`, `OptionGroup`, `Option`) lives in the DB and is fully editable from `/admin/menu` — categories (name, accroche, banner via `MediaPicker`, `active`, reorder, delete with "détacher les plats"), dishes (inline price, duplicate, reorder, `featured`), and the complete option CRUD. `Category.active` hides a whole section from the public menu; `Dish.featured` drives both the home-page specialities and the "Populaire" badge — it replaced the `specialtySlugs` / `popularDishIds` arrays that used to be hard-coded in `FeaturedDishes.tsx` and `MenuBrowser.tsx`. Every admin mutation calls the `revalidateMenu()` helper in `actions.ts` (admin + `/` + `/menu` + `/menu/[slug]` + sitemap) — use it rather than a bare `revalidatePath("/admin/menu")`, otherwise a price change can stay invisible. `src/data/*.ts` are **legacy mock files**; the live source is the DB via `src/lib/dishes.ts`. The app-level `Dish.id` maps to the DB `slug` (stable), not the cuid. Queries use `distinct: ["slug"]` because slugs can be duplicated by historical data. `Dish.image` is now the **sole** source for a dish photo — the old `dishImageOverrides` map that hard-locked 12 slugs is gone (migration `20260728103100_dish_image_from_crm` copied its values into the DB). Never reintroduce a code-side image override: it silently disables the CRM.
- `Order` has a French status string machine (`OrderStatus` in `src/types/index.ts`): `en attente → payée → en préparation → prête → en livraison → livrée → annulée`. Every transition is audited in `OrderEvent`. Loyalty points are awarded idempotently when status becomes `payée` (`pointsAwarded` flag). Order references look like `NK-<base36>`.
- Multi-restaurant: orders attach to a default `Restaurant` (chosen by `DEFAULT_RESTAURANT_SLUG`, see `src/lib/restaurants.ts`); Stripe **Connect** routes funds to that restaurant's account via `transfer_data` (`src/lib/stripe-connect.ts`, `src/lib/payment.ts`).
- **Naming**: the product is a restaurant. The schema keeps generic restaurant-era model names — `Restaurant` (= établissement), `Dish` (= plat), `Driver`.

### Restaurant features

Four self-contained features, each with a `src/lib` module, a public route, an `/admin` route, and (for three of them) their own Prisma models. The latter three are **paid at pickup** (a `paid` flag on the reservation, not Stripe) — they reserve a quota, they don't run checkout.

- **Stock du jour** (`stock.ts`, no new model): adds `dailyStock` / `soldToday` / `stockDate` to `Dish`. `remainingStock` does a **lazy daily reset** — `soldToday` is ignored unless `stockDate === stockToday()` (today in `Europe/Paris`, `AAAA-MM-JJ`). `null` `dailyStock` = unlimited. Drives the "épuisé" badge and caps cart quantities.
- **Demandes sur-mesure** (`/sur-mesure`, `/admin/sur-mesure`, `CustomRequest`): quote requests for group menus and sharing platters, status machine `nouveau → devis envoyé → confirmé → prêt → récupéré → annulé`.
- **Précommandes de saison** (`seasonal.ts`, `/boutique-de-saison`, `/admin/saison`, `SeasonalProduct` + `SeasonalPreorder`): quota-limited preorders (baklava platters, festive menus…) with a sales window (`salesStart/End`) and a pickup window. `remaining = quota − sold`. Throws `SeasonalError` on closed window / sold out.
- **Paniers anti-gaspi** (`antiwaste.ts`, `/anti-gaspi`, `/admin/paniers`, `AntiWasteOffer` + `AntiWasteReservation`): one surprise-basket offer **per day** (`date` is `@unique`), `remaining = quantity − sold`, throws `AntiWasteError`. Admin manages today's offer.

### Médiathèque (`media.ts` + pure `media-rules.ts`, `/admin/medias`, `Media`)

The CRM's image store — the reason the back-office can change any photo without a
deploy. `MediaPicker` (`src/components/admin/MediaPicker.tsx`) is the shared field
component: use it **everywhere** an image path is expected, never a raw text input.

- **Storage is deliberately outside `public/`**: uploads land in `.data/uploads/AAAA/MM/`
  (override with `MEDIA_DIR`) and are served by the `GET /media/[...path]` route.
  `.data` is already excluded from the deploy `rsync --delete` and is a named Docker
  volume (`<projet>_uploads`) in production — so a code update can never wipe a
  client's photos. Same-origin path ⇒ `next/image` works with no `remotePatterns`
  and the CSP `img-src 'self'` stays valid. **Don't move uploads into `public/`.**
- **Nothing the browser claims is trusted**: the pure `media-rules.ts` sniffs the
  MIME type from magic bytes (`sniffMimeType`), regenerates the filename server-side
  (`safeMediaSlug` + random suffix) and enforces the 8 MB per-file cap.
  `isSafeMediaUrl` backs `mediaUrlSchema` (`validation.ts`) so no external or
  `javascript:` URL can be stored as an image.
- **Input formats are wide, served formats are narrow — and that's the safety
  model.** `IMAGE_MIME_WHITELIST` accepts JPEG, PNG, **HEIC/HEIF** (the iPhone
  default), WebP, AVIF, GIF, TIFF, BMP and **SVG**, because `storeUpload`
  re-encodes *every* image to WebP through sharp. The uploaded bytes never reach a
  browser, so a scripted SVG comes back rasterized and inert. Consequently the
  conversion is **mandatory**: if sharp is missing or fails, the upload is rejected —
  never stored raw. Videos (`VIDEO_MIME_WHITELIST`: mp4/webm/mov) *are* stored as-is,
  hence the short list. `contentTypeForPath` uses a separate, deliberately narrower
  `SERVED_MIME_BY_EXTENSION` that omits `image/svg+xml` entirely (defense in depth).
- **Any aspect ratio must fit its card.** Photos come from a restaurateur's phone,
  so they can be panoramic, portrait or tiny. The rule across the site: put the
  image in a container that owns its shape (`relative` + `aspect-[…]`/fixed size +
  `overflow-hidden`) and render it with `fill` + `object-cover`. That crops, never
  overflows. **Exception — the logo and the `MediaPicker` preview use
  `object-contain`**: a wide logo cropped to a square is destroyed, and the admin
  must see what they actually picked. `globals.css` adds a `max-width: 100%` net for
  any raw `img`/`video`/`svg` (scoped with `:not([data-nimg])` so next/image `fill`
  is untouched). Never render `<Image>` with a possibly-empty `src` — next/image
  throws and takes the page down; guard it (see the poster-less video in
  `GallerySection`).
- **Replacing a file** (`replaceMedia`, `PUT /api/admin/media/[id]`) writes a *new*
  URL — the old one is served `immutable` for a year, so reusing it would strand
  visitors on the stale image — then rewrites every reference (dishes, categories,
  seasonal products, content blocks, logo/favicon/OG) in one transaction and deletes
  the old file. Add any new media-bearing column to **both** `replaceMedia` and
  `findMediaUsages`, or replacing a photo will silently orphan it.
- **Batching**: Next truncates request bodies over 10 MB (all routes), so
  `planUploadBatches` splits a drop of N photos into several requests under
  `MAX_REQUEST_BYTES`; the route also guards on `Content-Length` (413) so the admin
  gets a real message instead of a parse error. Don't raise the global body limit —
  it protects the public routes too.
- `source: "template"` rows are the repo's own files (`public/images`, `public/videos`),
  indexed at seed time by `prisma/seeds/template-media.ts` (kept out of `src/lib`
  because the seed runs outside Next and can't import `server-only`). They are
  **not deletable** from the CRM — they'd come back on the next deploy.
- `deleteMedia` refuses a media still referenced (`findMediaUsages`) — extend that
  function whenever a new model starts pointing at a media URL.

### Contenus éditoriaux (`content.ts` + pure `content-blocks.ts`, `/admin/contenus`, `ContentBlock`)

Everything editorial that used to be a hard-coded array in a component now lives here.
**Never reintroduce a literal content array in a component** — add a section instead.

- `content-blocks.ts` (pure, tested) holds `DEFAULT_CONTENT_BLOCKS` — an exact copy of the
  template's original content — plus `resolveSection`. Fusion rule: **as soon as a DB row
  exists for a `(section, key)` pair it wins outright** for every form field; untouched
  blocks keep showing the default. So a fresh client, an empty table, or an unreachable
  DB all render the original site — `getContentSection` (`content.ts`, React-`cache`d)
  catches DB errors and falls back. Deleting the row ("réinitialiser") restores the default.
- Sections: `hero`, `menu-hero`, `galerie`, `a-propos`, `a-propos-points`, `etapes`,
  `infos-pratiques`, `qr-avantages`, `raccourcis`, `footer-atouts`, and the three
  `page-*` legal pages. Adding one means: add to `CONTENT_SECTIONS`, `SECTION_LABELS`,
  defaults, and a preview link in `/admin/contenus`. A test enforces every declared
  section has at least one default block.
- **Client components receive blocks as props** (`Hero`, `MenuHero`, `GallerySection` are
  carousels with `useEffect`/`useRef`); server components read `getContentSection` directly.
- Icons come from the DB, so they go through `ICON_WHITELIST` / `resolveIconName` and the
  `ContentIcon` component — never a dynamic import or arbitrary lookup.
- Long texts are **Markdown**, rendered by the pure `markdown.ts`: it escapes the whole
  input with `escapeHtml` *first*, then re-injects only the allowed tags, and filters link
  targets through `safeUrl`. HTML pasted into the CRM can never reach the page. The legal
  pages wrap their template JSX in `LegalContent`, which swaps in the admin's Markdown
  only once written.
- `{ville}` inside `infos-pratiques` bodies is substituted with `contact.city` at render.

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
- Money is rounded with the `roundCurrency` helper — now exported from the pure `src/lib/utils.ts` and the **single** rounding point (`orders.ts`, `promo.ts`, `site-activity.ts` and the admin actions all import it). Don't re-inline `Math.round(x * 100) / 100`.

## Deployment

Vercel (`vercel.json`: build runs `prisma migrate deploy`, region `cdg1`, weekly re-engagement cron at `/api/cron/reengage` — runs `runMarketingAutomations`, protected by `CRON_SECRET`, which returns 503 until the secret is set) or Docker/VPS (`Dockerfile`, `docker-compose.yml`). See `DEPLOYMENT.md` and `DEPLOIEMENT-VPS.md`. Security headers are set in `next.config.mjs` (CSP intentionally omitted to avoid breaking Stripe/JSON-LD).

Production target is a **VPS** at `root@213.130.144.215` for `https://lodene.cloud`: keep Anatolia Grill isolated under Compose project `restaurant-turc` (`docker compose -p restaurant-turc …`), dedicated `restaurant-turc_pgdata` volume, app published on `127.0.0.1:3201` only, and the `lodene.cloud` Nginx vhost. If the server hosts other sites, don't touch them (`lodene.org`/boulangerie is on `3101`, the older restaurant app is on `3100`, es-viry is on `8090`). Full first-deploy guide in `DEPLOIEMENT-VPS.md`; `deploy/nginx.conf` is the reverse-proxy config (proxies to 3201).

Updates run from the Mac. The generic entry point is **`./deploy/deploy-client.sh <slug>`** — it sources the target params from `deploy/clients/<slug>.env` (VPS, remote dir, site URL, Compose project, host port), applies the client's optional asset overlay (`deploy/clients/<slug>/overlay/`), and `exec`s `deploy/update-production.sh`, the env-var-driven script (`DEPLOY_VPS`, `DEPLOY_REMOTE_DIR`, `DEPLOY_SITE_URL`, `DEPLOY_KEY`, `DEPLOY_COMPOSE_PROJECT`, `DEPLOY_OVERLAY_DIR`) that does local checks (typecheck + lint + build) → rsync (excluding `.env*`, so the remote secrets file is never overwritten) → overlay rsync → Docker rebuild → Prisma `migrate deploy` → `/api/health` check (see `deploy/MISE-A-JOUR.md`). `./deploy/redeploy.sh` is a backwards-compatible alias for `./deploy/deploy-client.sh anatolia-grill`. Deploy is over **rsync, not git pull**; GitHub is for source history, not the live server checkout.

### Multi-restaurant (same code, N deployments)

The same codebase serves multiple restaurants via **multi-instance** isolation (one Compose project + DB volume + port + Nginx vhost per restaurant). Full guide: **`MULTI-RESTAURANT.md`**. Key pieces: per-target config in `deploy/clients/<slug>.env` (+ `PORTS.md` registry, `EXEMPLE.env` template), remote secrets template `.env.client.example`, per-restaurant asset overlays `deploy/clients/<slug>/overlay/` (gitignored media, rsync'd over the tree before build), Nginx template `deploy/nginx.template.conf`. Initial content comes from a **seed profile**: `prisma/seed.ts` is a generic runner picking `prisma/seeds/<slug>.ts` via `SEED_PROFILE` (registry `PROFILES`, default `anatolia-grill`). Profiles carry `resetStrategy`: `"demo"` (anatolia only — destructive, deactivates other restaurants/dishes/promos) vs `"additive"` (upsert-only, safe for provisioning a real client). Provision a new client's remote DB once with `docker compose -p <slug> --env-file .env run --rm -e SEED_PROFILE=<slug> migrate node_modules/.bin/tsx prisma/seed.ts` — never run the `anatolia-grill`/demo profile or `prisma migrate reset` in prod.

Sibling instructions file: `AGENTS.md` (for non-Claude agents) restates the deploy command and the production constraints in French — never run `npm run db:seed` or `prisma migrate reset` in prod; if the server hosts other sites, never touch their containers or ports.
