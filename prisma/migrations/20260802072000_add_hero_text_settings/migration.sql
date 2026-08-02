ALTER TABLE "SiteSetting"
ADD COLUMN "heroTitle" TEXT,
ADD COLUMN "heroDescription" TEXT,
ADD COLUMN "heroTitleVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "heroDescriptionVisible" BOOLEAN NOT NULL DEFAULT true;
