-- Remove legacy demo zones from the previous Paris configuration.
DELETE FROM "DeliveryZone"
WHERE "postalCode" IN ('75011', '75012', '75020');
