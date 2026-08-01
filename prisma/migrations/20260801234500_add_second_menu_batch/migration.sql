-- Ajoute le second lot de plats Lauuale Simbo et actualise les fiches qui
-- existaient déjà. Migration additive : aucun contenu existant n'est supprimé.

INSERT INTO "Category" ("id", "slug", "name", "sortOrder")
VALUES
  ('category_entrees_lauuale', 'entrees', 'Entrées & accompagnements', 1),
  ('category_plats_africains_lauuale', 'plats-africains', 'Plats africains', 2),
  ('category_grillades_lauuale', 'grillades', 'Grillades', 3)
ON CONFLICT ("slug") DO NOTHING;

WITH existing_dishes (
  slug, name, description, price, image, sort_order, category_slug
) AS (
  VALUES
    ('pastels-maison', 'Pastels maison', 'Pastels croustillants farcis, vendus à la pièce et servis avec une sauce maison', 1.0, '/images/africain/29_pastels.webp', 1, 'entrees'),
    ('alloco', 'Bananes plantain', 'Bananes plantain mûres frites, dorées et fondantes, servies avec sauce maison', 5.0, '/images/africain/21_bananes-plantain.webp', 2, 'entrees'),
    ('thieb-poulet', 'Tiebe poulet aux légumes', 'Riz rouge savoureux, poulet mariné et légumes mijotés aux épices', 5.0, '/images/africain/36_thieb-poulet-legumes.webp', 2, 'plats-africains'),
    ('haricots-poulet', 'Haricots au poulet et aux légumes', 'Haricots mijotés servis avec poulet, légumes et sauce maison', 5.0, '/images/africain/28_haricots-poulet-legumes.webp', 6, 'plats-africains')
)
UPDATE "Dish"
SET
  "name" = existing_dishes.name,
  "description" = existing_dishes.description,
  "price" = existing_dishes.price,
  "image" = existing_dishes.image,
  "sortOrder" = existing_dishes.sort_order,
  "categoryId" = "Category"."id",
  "updatedAt" = CURRENT_TIMESTAMP
FROM existing_dishes
JOIN "Category" ON "Category"."slug" = existing_dishes.category_slug
WHERE "Dish"."slug" = existing_dishes.slug;

WITH new_dishes (
  id, slug, name, description, price, image, sort_order, category_slug
) AS (
  VALUES
    ('dish_attieke_legumes_lauuale', 'attieke-legumes', 'Attiéké légumes', 'Semoule de manioc accompagnée de légumes frais assaisonnés', 5.0, '/images/africain/20_attieke-legumes.webp', 3, 'entrees'),
    ('dish_patate_douce_lauuale', 'patate-douce', 'Patate douce', 'Patates douces fondantes et dorées, servies en accompagnement', 5.0, '/images/africain/30_patate-douce.webp', 4, 'entrees'),
    ('dish_sauce_mafe_riz_lauuale', 'sauce-mafe-riz', 'Sauce mafé & riz blanc', 'Sauce mafé onctueuse à l''arachide accompagnée de riz blanc', 5.0, '/images/africain/32_sauce-mafe-riz.webp', 10, 'plats-africains'),
    ('dish_sauce_tomate_riz_lauuale', 'sauce-tomate-riz', 'Sauce tomate & riz blanc', 'Sauce tomate mijotée accompagnée de riz blanc', 5.0, '/images/africain/33_sauce-tomate-riz.webp', 11, 'plats-africains'),
    ('dish_sauce_epinards_riz_lauuale', 'sauce-epinards-riz', 'Sauce épinards & riz blanc', 'Sauce aux épinards mijotés accompagnée de riz blanc', 5.0, '/images/africain/31_sauce-epinards-riz.webp', 12, 'plats-africains'),
    ('dish_sauce_yassa_riz_lauuale', 'sauce-yassa-riz', 'Sauce yassa & riz blanc', 'Sauce yassa aux oignons confits accompagnée de riz blanc', 5.0, '/images/africain/34_sauce-yassa-riz.webp', 13, 'plats-africains'),
    ('dish_djouka_fonio_lauuale', 'djouka-fonio', 'Djouka', 'Fonio traditionnel préparé maison et délicatement assaisonné', 5.0, '/images/africain/27_djouka-fonio.webp', 14, 'plats-africains'),
    ('dish_boeuf_grille_lauuale', 'boeuf-grille', 'Viande de bœuf grillée', 'Viande de bœuf assaisonnée puis grillée', 5.0, '/images/africain/22_boeuf-grille.webp', 6, 'grillades'),
    ('dish_soupe_boeuf_mijotee_lauuale', 'soupe-boeuf-mijotee', 'Soupe de viande de bœuf mijotée', 'Viande de bœuf longuement mijotée dans un bouillon parfumé', 5.0, '/images/africain/35_soupe-boeuf-mijotee.webp', 7, 'grillades'),
    ('dish_tilapia_lauuale', 'tilapia', 'Tilapia', 'Tilapia entier assaisonné et préparé maison', 6.0, '/images/africain/37_tilapia.webp', 8, 'grillades'),
    ('dish_capitaine_entier_lauuale', 'capitaine-entier', 'Capitaine entier', 'Poisson capitaine entier assaisonné et préparé maison', 12.0, '/images/africain/24_capitaine-entier.webp', 9, 'grillades'),
    ('dish_demi_capitaine_lauuale', 'demi-capitaine', 'Capitaine moitié', 'Demi-poisson capitaine assaisonné et préparé maison', 6.0, '/images/africain/26_demi-capitaine.webp', 10, 'grillades'),
    ('dish_cuisse_poulet_lauuale', 'cuisse-poulet', 'Cuisse de poulet', 'Cuisse de poulet assaisonnée, vendue à la pièce', 2.5, '/images/africain/25_cuisse-poulet.webp', 11, 'grillades'),
    ('dish_brochettes_boeuf_poulet_lauuale', 'brochettes-boeuf-poulet', 'Brochette bœuf ou poulet', 'Brochette de bœuf ou de poulet, vendue à la pièce', 1.5, '/images/africain/23_brochettes-boeuf-poulet.webp', 12, 'grillades')
)
INSERT INTO "Dish" (
  "id", "slug", "name", "description", "price", "image", "available",
  "soldToday", "sortOrder", "prepMinutes", "categoryId", "createdAt", "updatedAt"
)
SELECT
  new_dishes.id, new_dishes.slug, new_dishes.name, new_dishes.description,
  new_dishes.price, new_dishes.image, true, 0, new_dishes.sort_order, 20,
  "Category"."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM new_dishes
JOIN "Category" ON "Category"."slug" = new_dishes.category_slug
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "price" = EXCLUDED."price",
  "image" = EXCLUDED."image",
  "sortOrder" = EXCLUDED."sortOrder",
  "categoryId" = EXCLUDED."categoryId",
  "updatedAt" = CURRENT_TIMESTAMP;
