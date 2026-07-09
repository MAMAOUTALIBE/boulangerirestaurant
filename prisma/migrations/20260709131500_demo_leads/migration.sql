-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "DemoLead" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "visits" INTEGER NOT NULL DEFAULT 1,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoLead_email_idx" ON "DemoLead"("email");

-- CreateIndex
CREATE INDEX "DemoLead_phone_idx" ON "DemoLead"("phone");

-- CreateIndex
CREATE INDEX "DemoLead_source_idx" ON "DemoLead"("source");

-- CreateIndex
CREATE INDEX "DemoLead_lastSeenAt_idx" ON "DemoLead"("lastSeenAt");
