-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "dailyStock" INTEGER,
ADD COLUMN     "soldToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockDate" TEXT;
