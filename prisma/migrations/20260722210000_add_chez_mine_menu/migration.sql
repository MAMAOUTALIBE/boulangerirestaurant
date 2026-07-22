-- Enrichit la carte Chez Miné avec les plats photographiés, sans seed destructif.
INSERT INTO "Category" ("id", "slug", "name", "sortOrder")
VALUES
  ('category_grillades_20260722', 'grillades', 'Grillades & Kebabs', 2),
  ('category_sandwichs_20260722', 'sandwichs', 'Sandwichs & Burgers', 3),
  ('category_specialites_20260722', 'specialites', 'Spécialités', 5),
  ('category_desserts_20260722', 'desserts', 'Desserts', 6)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder";

-- Les produits existants sont mis à jour ; les produits absents sont créés.
WITH menu_items (
  id, slug, name, description, price, image, tag, sort_order, category_slug
) AS (
  VALUES
    ('dish_hamburger_maison_20260721', 'hamburger-maison', 'Hamburger maison', 'Steak de bœuf grillé, cheddar fondant, salade, tomate, oignon rouge et sauce maison', 12.9, '/images/chez-mine/cheeseburger.jpg', 'Populaire', 1, 'sandwichs'),
    ('dish_double_cheeseburger_20260722', 'double-cheeseburger', 'Double cheeseburger', 'Deux steaks de bœuf grillés, double cheddar, salade, oignons et sauce maison, servi avec frites', 14.9, '/images/chez-mine/double-cheeseburger.jpg', 'Généreux', 2, 'sandwichs'),
    ('dish_sandwich_doner_poulet_20260722', 'sandwich-doner-poulet', 'Sandwich döner poulet', 'Pain maison, émincé de poulet grillé, salade, tomate, oignons et sauce au choix, servi avec frites', 10.9, '/images/chez-mine/sandwich-doner-poulet.jpg', 'Populaire', 3, 'sandwichs'),
    ('dish_sandwich_kofte_20260722', 'sandwich-kofte', 'Sandwich köfte', 'Pain maison, köfte grillées, salade, tomate, oignons et sauce au choix, servi avec frites', 11.5, '/images/chez-mine/sandwich-kofte.jpg', NULL, 4, 'sandwichs'),
    ('dish_sandwich_steak_20260722', 'sandwich-steak', 'Sandwich steak cheddar', 'Pain maison, steaks grillés, cheddar, salade, tomate et oignons, servi avec frites', 11.9, '/images/chez-mine/sandwich-steak.jpg', NULL, 5, 'sandwichs'),
    ('dish_sandwich_poulet_20260722', 'sandwich-poulet-marine', 'Sandwich poulet mariné', 'Pain maison, morceaux de poulet marinés et grillés, crudités et sauce au choix, servi avec frites', 10.9, '/images/chez-mine/sandwich-poulet-marine.jpg', NULL, 6, 'sandwichs'),
    ('dish_tacos_maison_20260721', 'tacos-maison', 'Tacos poulet', 'Poulet mariné, frites, cheddar et sauce fromagère dans une tortilla grillée', 11.9, '/images/chez-mine/sandwich-poulet-epice.jpg', 'Nouveau', 7, 'sandwichs'),
    ('dish_brochettes_poulet_20260722', 'assiette-brochettes-poulet', 'Assiette brochettes de poulet', 'Deux brochettes de poulet grillé, riz, boulgour, salade et sauces maison', 15.9, '/images/chez-mine/assiette-brochettes-poulet.jpg', 'Grillé minute', 4, 'grillades'),
    ('dish_cotelettes_agneau_20260722', 'assiette-cotelettes-agneau', 'Assiette côtelettes d''agneau', 'Côtelettes d''agneau grillées, riz, boulgour, salade et sauces maison', 18.9, '/images/chez-mine/assiette-cotelettes-agneau.jpg', 'Grillades', 5, 'grillades'),
    ('dish_doner_poulet_20260722', 'assiette-doner-poulet', 'Assiette döner poulet', 'Émincé de poulet döner, riz, boulgour, salade et sauces maison', 14.9, '/images/chez-mine/assiette-doner-poulet.jpg', NULL, 6, 'grillades'),
    ('dish_saute_veau_20260722', 'saute-veau', 'Sauté de veau', 'Veau mijoté aux légumes et aux épices, servi avec boulgour et salade', 15.9, '/images/chez-mine/saute-veau.jpg', 'Plat du jour', 7, 'specialites'),
    ('dish_revani_20260722', 'revani', 'Revani', 'Gâteau turc moelleux à la semoule, imbibé de sirop et parsemé de noix de coco', 4.9, '/images/chez-mine/revani.jpg', 'Maison', 8, 'desserts')
)
INSERT INTO "Dish" (
  "id", "slug", "name", "description", "price", "image", "tag",
  "available", "soldToday", "sortOrder", "prepMinutes", "categoryId",
  "createdAt", "updatedAt"
)
SELECT
  menu_items.id,
  menu_items.slug,
  menu_items.name,
  menu_items.description,
  menu_items.price,
  menu_items.image,
  menu_items.tag,
  true,
  0,
  menu_items.sort_order,
  15,
  "Category"."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM menu_items
JOIN "Category" ON "Category"."slug" = menu_items.category_slug
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "price" = EXCLUDED."price",
  "image" = EXCLUDED."image",
  "tag" = EXCLUDED."tag",
  "available" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "categoryId" = EXCLUDED."categoryId",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Aligne aussi les photos de spécialités déjà présentes dans la carte.
UPDATE "Dish"
SET "image" = '/images/chez-mine/assiette-brochettes-kofta.jpg', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'adana-kebab';

UPDATE "Dish"
SET "image" = '/images/chez-mine/assiette-doner.jpg', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'iskender-kebab';

UPDATE "Dish"
SET "image" = '/images/chez-mine/assiette-mixte.jpg', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'kebab-grille';

UPDATE "Dish"
SET "image" = '/images/chez-mine/soupe-lentilles.jpg', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'mercimek-corbasi';

UPDATE "Dish"
SET "image" = '/images/chez-mine/baklava-maison.jpg', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'baklava';

-- Remplace uniquement l'identité générique ; une identité personnalisée reste intacte.
UPDATE "SiteSetting"
SET
  "name" = 'Chez Miné',
  "shortName" = 'Chez Miné',
  "description" = 'Chez Miné, restaurant turc : kebabs, grillades, sandwichs, assiettes généreuses et desserts maison. Sur place, à emporter ou en livraison.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'default'
  AND ("name" IS NULL OR "name" IN ('Restaurant', 'Anatolia Grill'));
