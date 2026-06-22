-- CreateTable
CREATE TABLE "SeasonalProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "salesStart" TIMESTAMP(3) NOT NULL,
    "salesEnd" TIMESTAMP(3) NOT NULL,
    "pickupStart" TEXT NOT NULL,
    "pickupEnd" TEXT NOT NULL,
    "quota" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalPreorder" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'réservé',
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pickupDate" TEXT NOT NULL,
    "notes" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SeasonalPreorder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalProduct_slug_key" ON "SeasonalProduct"("slug");

-- CreateIndex
CREATE INDEX "SeasonalProduct_active_idx" ON "SeasonalProduct"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalPreorder_reference_key" ON "SeasonalPreorder"("reference");

-- CreateIndex
CREATE INDEX "SeasonalPreorder_productId_idx" ON "SeasonalPreorder"("productId");

-- CreateIndex
CREATE INDEX "SeasonalPreorder_email_idx" ON "SeasonalPreorder"("email");

-- AddForeignKey
ALTER TABLE "SeasonalPreorder" ADD CONSTRAINT "SeasonalPreorder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SeasonalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
