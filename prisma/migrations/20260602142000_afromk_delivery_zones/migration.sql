-- Align delivery zones with restaurant service area.
INSERT INTO "DeliveryZone" ("id", "postalCode", "fee", "minOrder")
VALUES
  ('delivery-zone-91260', '91260', 3.5, 15),
  ('delivery-zone-91200', '91200', 4.5, 20),
  ('delivery-zone-91600', '91600', 4, 18)
ON CONFLICT ("postalCode") DO UPDATE SET
  "fee" = EXCLUDED."fee",
  "minOrder" = EXCLUDED."minOrder";
