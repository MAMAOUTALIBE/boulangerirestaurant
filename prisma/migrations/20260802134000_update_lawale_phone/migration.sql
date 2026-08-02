-- Numéro public communiqué par Lawale Simbo le 2 août 2026.
-- Le champ reste modifiable depuis Administration → Paramètres.
UPDATE "SiteSetting"
SET
  "phone" = '06 66 20 79 58',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'default';
