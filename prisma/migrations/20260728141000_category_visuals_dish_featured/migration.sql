-- Catégories : accroche, bannière et masquage, éditables depuis /admin/menu.
ALTER TABLE "Category" ADD COLUMN "description" TEXT;
ALTER TABLE "Category" ADD COLUMN "image" TEXT;
ALTER TABLE "Category" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Mise en avant d'un plat, désormais pilotée par le CRM.
ALTER TABLE "Dish" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

-- Reprise à l'identique des deux listes qui étaient codées en dur :
--   * `specialtySlugs`  (src/components/FeaturedDishes.tsx) — trio de l'accueil
--   * `popularDishIds`  (src/components/MenuBrowser.tsx)    — badge « Populaire »
-- Leur union devient le drapeau unique `featured`, que l'admin peut ensuite
-- modifier librement. L'accueil affiche les 3 premiers par ordre d'affichage.
UPDATE "Dish" SET "featured" = true
  WHERE "slug" IN (
    'thieb-poisson',
    'yassa-poulet',
    'attieke-poisson-alloco',
    'mafe-boeuf'
  );
