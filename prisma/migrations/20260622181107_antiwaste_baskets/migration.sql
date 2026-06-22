-- CreateTable
CREATE TABLE "AntiWasteOffer" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Panier surprise',
    "description" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL,
    "originalValue" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "pickupStart" TEXT NOT NULL DEFAULT '18:00',
    "pickupEnd" TEXT NOT NULL DEFAULT '19:30',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AntiWasteOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AntiWasteReservation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'réservé',
    "offerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AntiWasteReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AntiWasteOffer_date_key" ON "AntiWasteOffer"("date");

-- CreateIndex
CREATE INDEX "AntiWasteOffer_active_idx" ON "AntiWasteOffer"("active");

-- CreateIndex
CREATE UNIQUE INDEX "AntiWasteReservation_reference_key" ON "AntiWasteReservation"("reference");

-- CreateIndex
CREATE INDEX "AntiWasteReservation_offerId_idx" ON "AntiWasteReservation"("offerId");

-- CreateIndex
CREATE INDEX "AntiWasteReservation_email_idx" ON "AntiWasteReservation"("email");

-- AddForeignKey
ALTER TABLE "AntiWasteReservation" ADD CONSTRAINT "AntiWasteReservation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "AntiWasteOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
