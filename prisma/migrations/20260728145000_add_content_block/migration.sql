-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT,
    "subtitle" TEXT,
    "body" TEXT,
    "mediaUrl" TEXT,
    "posterUrl" TEXT,
    "alt" TEXT,
    "href" TEXT,
    "ctaLabel" TEXT,
    "icon" TEXT,
    "data" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_section_key_key" ON "ContentBlock"("section", "key");

-- CreateIndex
CREATE INDEX "ContentBlock_section_idx" ON "ContentBlock"("section");
