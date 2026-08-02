-- Le libellé de l'établissement était resté sur l'ancienne graphie fautive
-- « Lauuale Simbo ». Il alimente notamment le nom du compte Stripe Connect
-- (src/lib/stripe-connect.ts), donc il doit porter la raison sociale exacte.
--
-- Le slug technique `anatolia-grill` est volontairement conservé : il est
-- référencé par DEFAULT_RESTAURANT_SLUG et par le projet Compose existant.
UPDATE "Restaurant"
SET "name" = 'Lawale Simbo'
WHERE "slug" = 'anatolia-grill'
  AND "name" <> 'Lawale Simbo';
