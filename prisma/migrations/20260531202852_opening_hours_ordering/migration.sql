-- CreateTable
CREATE TABLE "OpeningHour" (
    "id" SERIAL NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "openMinutes" INTEGER NOT NULL DEFAULT 660,
    "closeMinutes" INTEGER NOT NULL DEFAULT 1380,

    CONSTRAINT "OpeningHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderingSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "slotIntervalMin" INTEGER NOT NULL DEFAULT 15,
    "leadTimeMin" INTEGER NOT NULL DEFAULT 20,
    "capacityPerSlot" INTEGER NOT NULL DEFAULT 8,

    CONSTRAINT "OrderingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpeningHour_dayOfWeek_key" ON "OpeningHour"("dayOfWeek");
