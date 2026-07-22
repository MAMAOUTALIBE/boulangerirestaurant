-- Ajoute le Tacos maison au menu existant sans exécuter le seed de démo.
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
  'dish_tacos_maison_20260721',
  'tacos-maison',
  'Tacos maison',
  'Viande grillée, frites, cheddar fondant et sauce fromagère dans une tortilla toastée',
  11.9,
  '/images/galerie/tacos-maison.webp',
  'Nouveau',
  true,
  0,
  6,
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
