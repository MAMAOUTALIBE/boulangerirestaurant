-- Ajoute le Hamburger maison au menu existant sans exécuter le seed de démo.
INSERT INTO "Dish" (
  "id",
  "slug",
  "name",
  "description",
  "price",
  "image",
  "tag",
  "available",
  "soldToday",
  "sortOrder",
  "prepMinutes",
  "categoryId",
  "createdAt",
  "updatedAt"
)
SELECT
  'dish_hamburger_maison_20260721',
  'hamburger-maison',
  'Hamburger maison',
  'Steak de bœuf grillé, cheddar fondant, salade, tomate, oignon rouge et sauce maison',
  12.9,
  '/images/galerie/hamburger-maison.webp',
  'Nouveau',
  true,
  0,
  5,
  15,
  "id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Category"
WHERE "slug" = 'grillades'
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
