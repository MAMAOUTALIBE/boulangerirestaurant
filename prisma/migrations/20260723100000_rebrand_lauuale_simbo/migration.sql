-- Repositionne l'instance en Lauuale Simbo sans supprimer l'historique.
INSERT INTO "Category" ("id", "slug", "name", "sortOrder")
VALUES
  ('category_entrees_lauuale', 'entrees', 'Entrées & accompagnements', 1),
  ('category_plats_africains', 'plats-africains', 'Plats africains', 2),
  ('category_grillades_lauuale', 'grillades', 'Grillades', 3),
  ('category_desserts_lauuale', 'desserts', 'Desserts', 4),
  ('category_boissons_lauuale', 'boissons', 'Boissons maison', 5)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder";

-- L'ancienne carte reste en base pour l'audit, mais disparaît du site public.
UPDATE "Dish" SET "available" = false, "updatedAt" = CURRENT_TIMESTAMP;

WITH menu_items (
  id, slug, name, description, price, image, tag, sort_order, category_slug
) AS (
  VALUES
    ('dish_pastels_lauuale', 'pastels-maison', 'Pastels maison', 'Beignets croustillants farcis au poisson, servis avec notre sauce tomate relevée', 6.9, '/images/africain/pastels-alloco.webp', 'Maison', 1, 'entrees'),
    ('dish_alloco_lauuale', 'alloco', 'Alloco', 'Bananes plantain mûres frites, dorées et fondantes, servies avec sauce maison', 5.9, '/images/africain/pastels-alloco.webp', NULL, 2, 'entrees'),
    ('dish_thieb_poisson_lauuale', 'thieb-poisson', 'Thiéboudiène poisson', 'Riz parfumé à la tomate, poisson mariné et légumes mijotés selon la tradition', 16.9, '/images/africain/thiep-poisson.webp', 'Signature', 1, 'plats-africains'),
    ('dish_thieb_poulet_lauuale', 'thieb-poulet', 'Thiéboudiène poulet', 'Riz rouge savoureux, poulet mariné et légumes mijotés aux épices', 14.9, '/images/africain/thiep-poulet.webp', 'Populaire', 2, 'plats-africains'),
    ('dish_yassa_poulet_lauuale', 'yassa-poulet', 'Yassa poulet', 'Poulet mariné au citron, oignons doucement confits et riz parfumé', 14.9, '/images/africain/yassa-poulet.webp', 'Incontournable', 3, 'plats-africains'),
    ('dish_mafe_boeuf_lauuale', 'mafe-boeuf', 'Mafé bœuf', 'Bœuf mijoté dans une sauce onctueuse à l''arachide, servi avec du riz', 15.9, '/images/africain/mafe-boeuf.webp', 'Généreux', 4, 'plats-africains'),
    ('dish_attieke_poisson_lauuale', 'attieke-poisson-alloco', 'Attiéké poisson & alloco', 'Poisson grillé, semoule de manioc, bananes plantain et crudités fraîches', 16.9, '/images/africain/attieke-poisson-alloco.webp', 'Grillé minute', 1, 'grillades'),
    ('dish_poulet_braise_lauuale', 'poulet-braise-alloco', 'Poulet braisé & alloco', 'Poulet mariné et braisé, bananes plantain dorées, crudités et sauce maison', 15.9, '/images/africain/thiep-poulet.webp', NULL, 2, 'grillades'),
    ('dish_douceur_africaine', 'douceur-africaine', 'Douceur africaine', 'Dessert du jour aux saveurs d''Afrique, préparé maison selon l''inspiration', 5.9, '/images/africain/desserts-africains.webp', 'Maison', 1, 'desserts'),
    ('dish_bissap_lauuale', 'bissap-maison', 'Bissap maison', 'Infusion fraîche de fleurs d''hibiscus, délicatement sucrée et parfumée', 3.5, '/images/africain/boissons-bissap-gingembre-bouye.webp', 'Maison', 1, 'boissons'),
    ('dish_gingembre_lauuale', 'jus-gingembre', 'Jus de gingembre', 'Boisson maison au gingembre frais, tonique et légèrement citronnée', 3.5, '/images/africain/boissons-bissap-gingembre-bouye.webp', NULL, 2, 'boissons'),
    ('dish_bouye_lauuale', 'jus-bouye', 'Jus de bouye', 'Boisson crémeuse au fruit du baobab, douce et rafraîchissante', 4.0, '/images/africain/boissons-bissap-gingembre-bouye.webp', NULL, 3, 'boissons')
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
  20,
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
  "prepMinutes" = EXCLUDED."prepMinutes",
  "categoryId" = EXCLUDED."categoryId",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "SiteSetting" (
  "id", "name", "shortName", "description", "updatedAt"
)
VALUES (
  'default',
  'Lauuale Simbo',
  'Lauuale Simbo',
  'Lauuale Simbo, restaurant de spécialités africaines : thiéboudiène, yassa, mafé, attiéké, alloco et boissons maison. Sur place, à emporter ou en livraison.',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "shortName" = EXCLUDED."shortName",
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;
