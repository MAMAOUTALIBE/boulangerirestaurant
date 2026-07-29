-- Ajoute au menu les plats photographiés dans la galerie.
-- Migration additive : aucun plat existant n'est modifié ou supprimé.
INSERT INTO "Category" ("id", "slug", "name", "sortOrder")
VALUES (
  'category_menus_complets_lauuale',
  'menus-complets',
  'Menus complets',
  4
)
ON CONFLICT ("slug") DO NOTHING;

WITH gallery_dishes (
  id, slug, name, description, price, image, sort_order, category_slug
) AS (
  VALUES
    (
      'dish_poisson_tubercules_lauuale',
      'poisson-tubercules-sauce',
      'Poisson, tubercules & sauce',
      'Poisson frit, tubercules dorés, oignons marinés et sauce tomate maison',
      5.0,
      '/images/africain/01_poisson_tubercules_sauce.webp',
      5,
      'plats-africains'
    ),
    (
      'dish_haricots_poulet_lauuale',
      'haricots-poulet',
      'Haricots au poulet',
      'Haricots mijotés servis avec poulet, légumes et sauce maison',
      5.0,
      '/images/africain/02_haricots_au_poulet.webp',
      6,
      'plats-africains'
    ),
    (
      'dish_mafe_poulet_lauuale',
      'mafe-poulet',
      'Mafé au poulet',
      'Poulet mijoté dans une sauce onctueuse à l''arachide, servi avec du riz blanc',
      5.0,
      '/images/africain/03_mafe_au_poulet.webp',
      7,
      'plats-africains'
    ),
    (
      'dish_poisson_alloko_lauuale',
      'poisson-alloko',
      'Poisson & alloko',
      'Poisson frit accompagné de bananes plantain alloko et sauce maison',
      5.0,
      '/images/africain/04_poisson_alloko.webp',
      3,
      'grillades'
    ),
    (
      'dish_poisson_crudites_lauuale',
      'poisson-grille-crudites',
      'Poisson grillé & crudités',
      'Poisson grillé servi avec des crudités fraîches et une sauce maison',
      5.0,
      '/images/africain/05_poisson_grille_crudites.webp',
      4,
      'grillades'
    ),
    (
      'dish_poisson_oignons_lauuale',
      'poisson-oignons',
      'Poisson aux oignons',
      'Poisson entier frit garni d''oignons marinés et accompagné de piment',
      5.0,
      '/images/africain/06_poisson_aux_oignons.webp',
      5,
      'grillades'
    ),
    (
      'dish_riz_rouge_poulet_lauuale',
      'riz-rouge-poulet',
      'Riz rouge au poulet',
      'Riz rouge parfumé servi avec poulet mariné et légumes mijotés',
      5.0,
      '/images/africain/07_riz_rouge_poulet.webp',
      8,
      'plats-africains'
    ),
    (
      'dish_menu_poisson_alloko_lauuale',
      'menu-poisson-alloko',
      'Menu poisson & alloko',
      'Poisson aux oignons, alloko, dégué et boisson maison',
      5.0,
      '/images/africain/08_menu_alloko_poisson_logo.webp',
      1,
      'menus-complets'
    ),
    (
      'dish_menu_poisson_complet_lauuale',
      'menu-poisson-alloko-degue-orange',
      'Menu poisson complet',
      'Poisson aux oignons, alloko, dégué et jus d''orange',
      5.0,
      '/images/africain/09_menu_alloko_poisson_degue_jus_orange.webp',
      2,
      'menus-complets'
    ),
    (
      'dish_menu_mafe_complet_lauuale',
      'menu-mafe-degue-orange',
      'Menu mafé complet',
      'Mafé, riz blanc, alloko, dégué et jus d''orange',
      5.0,
      '/images/africain/10_menu_mafe_degue_jus_orange.webp',
      3,
      'menus-complets'
    ),
    (
      'dish_menu_riz_rouge_complet_lauuale',
      'menu-riz-rouge-poulet-alloko',
      'Menu riz rouge complet',
      'Riz rouge au poulet, légumes, alloko, dégué et bissap',
      5.0,
      '/images/africain/11_menu_riz_rouge_poulet_alloko_degue_bissap.webp',
      4,
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
  gallery_dishes.id,
  gallery_dishes.slug,
  gallery_dishes.name,
  gallery_dishes.description,
  gallery_dishes.price,
  gallery_dishes.image,
  true,
  0,
  gallery_dishes.sort_order,
  20,
  "Category"."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM gallery_dishes
JOIN "Category" ON "Category"."slug" = gallery_dishes.category_slug
ON CONFLICT ("slug") DO NOTHING;
