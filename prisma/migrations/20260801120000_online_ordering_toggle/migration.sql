-- Le lancement se fait en mode vitrine : aucune commande publique tant que
-- l'administrateur n'a pas explicitement activé cette fonctionnalité.
ALTER TABLE "OrderingSetting"
ADD COLUMN "onlineOrderingEnabled" BOOLEAN NOT NULL DEFAULT false;
