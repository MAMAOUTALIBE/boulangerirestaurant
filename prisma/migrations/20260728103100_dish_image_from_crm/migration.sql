-- Les images de ces plats étaient forcées dans le code (table `dishImageOverrides`
-- de `src/lib/dishes.ts`), ce qui rendait le champ « image » du CRM sans effet.
-- On recopie une dernière fois ces chemins en base — le rendu public est donc
-- identique — puis le code cesse de les surcharger : la base devient la seule
-- source de vérité et l'admin peut enfin changer la photo d'un plat.
UPDATE "Dish" SET "image" = '/images/africain/pastels-alloco.webp'
  WHERE "slug" IN ('pastels-maison', 'alloco');

UPDATE "Dish" SET "image" = '/images/africain/thiep-poisson.webp'
  WHERE "slug" = 'thieb-poisson';

UPDATE "Dish" SET "image" = '/images/africain/thiep-poulet.webp'
  WHERE "slug" IN ('thieb-poulet', 'poulet-braise-alloco');

UPDATE "Dish" SET "image" = '/images/africain/yassa-poulet.webp'
  WHERE "slug" = 'yassa-poulet';

UPDATE "Dish" SET "image" = '/images/africain/mafe-boeuf.webp'
  WHERE "slug" = 'mafe-boeuf';

UPDATE "Dish" SET "image" = '/images/africain/attieke-poisson-alloco.webp'
  WHERE "slug" = 'attieke-poisson-alloco';

UPDATE "Dish" SET "image" = '/images/africain/desserts-africains.webp'
  WHERE "slug" = 'douceur-africaine';

UPDATE "Dish" SET "image" = '/images/africain/boissons-bissap-gingembre-bouye.webp'
  WHERE "slug" IN ('bissap-maison', 'jus-gingembre', 'jus-bouye');
