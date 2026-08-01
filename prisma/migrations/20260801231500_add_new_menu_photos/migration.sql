-- Intègre les nouvelles photos du menu et ajoute les deux plats manquants.
-- Migration additive : aucun plat ni réglage existant n'est supprimé.

-- Les six fiches déjà présentes reçoivent un nouveau chemin afin de contourner
-- le cache longue durée des images statiques.
UPDATE "Dish"
SET
  "image" = CASE "slug"
    WHEN 'riz-rouge-poulet' THEN '/images/africain/12_riz_rouge_poulet_2026.webp'
    WHEN 'poisson-tubercules-sauce' THEN '/images/africain/15_poisson_igname_sauce.webp'
    WHEN 'menu-poisson-alloko-degue-orange' THEN '/images/africain/14_menu_grillades_alloko_degue_jus.webp'
    WHEN 'menu-poisson-alloko' THEN '/images/africain/17_menu_alloko_poisson.webp'
    WHEN 'menu-mafe-degue-orange' THEN '/images/africain/18_menu_mafe.webp'
    WHEN 'menu-riz-rouge-poulet-alloko' THEN '/images/africain/19_menu_riz_gras_rouge.webp'
    ELSE "image"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" IN (
  'riz-rouge-poulet',
  'poisson-tubercules-sauce',
  'menu-poisson-alloko-degue-orange',
  'menu-poisson-alloko',
  'menu-mafe-degue-orange',
  'menu-riz-rouge-poulet-alloko'
);

-- Ces catégories existent déjà sur les installations Lauuale Simbo. Les
-- INSERT restent néanmoins sûrs pour une base ancienne ou partiellement créée.
INSERT INTO "Category" ("id", "slug", "name", "sortOrder")
VALUES
  ('category_plats_africains_lauuale', 'plats-africains', 'Plats africains', 2),
  ('category_menus_complets_lauuale', 'menus-complets', 'Menus complets', 4)
ON CONFLICT ("slug") DO NOTHING;

WITH new_dishes (
  id, slug, name, description, price, image, sort_order, category_slug
) AS (
  VALUES
    (
      'dish_riz_poulet_legumes_lauuale',
      'riz-poulet-legumes',
      'Riz au poulet & légumes',
      'Riz rouge parfumé, poulet rôti et légumes mijotés dans une sauce maison',
      5.0,
      '/images/africain/13_riz_poulet_legumes.webp',
      9,
      'plats-africains'
    ),
    (
      'dish_formule_riz_poulet_alloko_lauuale',
      'formule-riz-poulet-alloko',
      'Formule riz, poulet & alloko',
      'Riz rouge au poulet, légumes, alloko, dégué et boisson maison',
      5.0,
      '/images/africain/16_formule_riz_poulet_alloko.webp',
      5,
      'menus-complets'
    )
)
INSERT INTO "Dish" (
  "id",
  "slug",
  "name",
  "description",
  "price",
  "image",
  "available",
  "soldToday",
  "sortOrder",
  "prepMinutes",
  "categoryId",
  "createdAt",
  "updatedAt"
)
SELECT
  new_dishes.id,
  new_dishes.slug,
  new_dishes.name,
  new_dishes.description,
  new_dishes.price,
  new_dishes.image,
  true,
  0,
  new_dishes.sort_order,
  20,
  "Category"."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM new_dishes
JOIN "Category" ON "Category"."slug" = new_dishes.category_slug
ON CONFLICT ("slug") DO NOTHING;
