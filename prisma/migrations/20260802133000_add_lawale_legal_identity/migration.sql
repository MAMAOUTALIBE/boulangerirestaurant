-- Complète l'identité légale éditable du restaurant avec les champs absents.
ALTER TABLE "SiteSetting"
  ADD COLUMN "legalSiren" TEXT,
  ADD COLUMN "legalApe" TEXT;

-- Données vérifiées dans l'attestation RNE/INPI du 2 août 2026.
-- Les coordonnées non présentes dans le document (téléphone, e-mail, réseaux,
-- horaires) restent inchangées.
INSERT INTO "SiteSetting" (
  "id",
  "name",
  "shortName",
  "description",
  "address",
  "city",
  "legalCompany",
  "legalStatus",
  "legalCapital",
  "legalSiren",
  "legalSiret",
  "legalApe",
  "legalDirector",
  "updatedAt"
)
VALUES (
  'default',
  'Lawale Simbo',
  'Lawale Simbo',
  'Lawale Simbo, restaurant et traiteur. Restauration sur place, à emporter et en livraison.',
  '181 rue Robespierre, 93170 Bagnolet',
  'Bagnolet',
  'LAWALE SIMBO',
  'EURL (SARL à associé unique)',
  '1 000 €',
  '913 420 048',
  '913 420 048 00021',
  '5610C — Restauration de type rapide',
  'Mamou Keita (nom d’usage : Bah)',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "shortName" = EXCLUDED."shortName",
  "description" = EXCLUDED."description",
  "address" = EXCLUDED."address",
  "city" = EXCLUDED."city",
  "legalCompany" = EXCLUDED."legalCompany",
  "legalStatus" = EXCLUDED."legalStatus",
  "legalCapital" = EXCLUDED."legalCapital",
  "legalSiren" = EXCLUDED."legalSiren",
  "legalSiret" = EXCLUDED."legalSiret",
  "legalApe" = EXCLUDED."legalApe",
  "legalDirector" = EXCLUDED."legalDirector",
  "updatedAt" = CURRENT_TIMESTAMP;
