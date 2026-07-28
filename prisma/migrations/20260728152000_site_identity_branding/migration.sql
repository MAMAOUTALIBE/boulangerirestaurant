-- Image de marque, référencement et mentions légales, éditables depuis
-- /admin/parametres. Tous nullables : vide = repli sur `defaultSiteConfig`.
ALTER TABLE "SiteSetting" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "faviconUrl" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "ogImageUrl" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "tagline" TEXT;

ALTER TABLE "SiteSetting" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "metaDescription" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "keywords" TEXT;

ALTER TABLE "SiteSetting" ADD COLUMN "legalCompany" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "legalStatus" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "legalCapital" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "legalSiret" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "legalVat" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "legalDirector" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "legalHost" TEXT;

-- Couleur d'accent libre, utilisée quand OrderingSetting.colorPalette = 'perso'.
ALTER TABLE "SiteSetting" ADD COLUMN "accentColor" TEXT;
