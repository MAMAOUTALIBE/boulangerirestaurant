-- Conserve le choix existant : un site auparavant ouvert garde son flux complet.
ALTER TABLE "OrderingSetting"
ADD COLUMN "orderingMode" TEXT NOT NULL DEFAULT 'vitrine';

UPDATE "OrderingSetting"
SET "orderingMode" = CASE
  WHEN "onlineOrderingEnabled" = true THEN 'paiement_en_ligne'
  ELSE 'vitrine'
END;

ALTER TABLE "OrderingSetting"
DROP COLUMN "onlineOrderingEnabled";
