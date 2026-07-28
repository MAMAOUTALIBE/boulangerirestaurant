-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "folder" TEXT,
    "source" TEXT NOT NULL DEFAULT 'upload',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_url_key" ON "Media"("url");

-- CreateIndex
CREATE INDEX "Media_source_idx" ON "Media"("source");

-- CreateIndex
CREATE INDEX "Media_folder_idx" ON "Media"("folder");
