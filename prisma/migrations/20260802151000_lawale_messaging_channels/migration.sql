-- Canaux de messagerie de Lawale Simbo.
--
-- Avant : le site pointait encore vers le numéro WhatsApp de l'ancienne
-- identité (07 75 78 78 25) et vers un pseudo Telegram inexistant
-- (« lauualesimbo »). Les deux étaient visibles en pied de page, sur la
-- feuille de contact mobile et sur la page QR code.
--
-- Après : WhatsApp pointe sur la ligne du restaurant, Telegram est masqué
-- (chaîne vide → tous les rendus filtrent le lien). Les deux restent
-- modifiables depuis Administration → Paramètres.
INSERT INTO "SiteSetting" ("id", "whatsappNumber", "telegramUsername", "updatedAt")
VALUES ('default', '+33666207958', '', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "whatsappNumber" = EXCLUDED."whatsappNumber",
  "telegramUsername" = EXCLUDED."telegramUsername",
  "updatedAt" = CURRENT_TIMESTAMP;
