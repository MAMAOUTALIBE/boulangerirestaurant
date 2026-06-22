-- CreateTable
CREATE TABLE "CustomCakeRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'nouveau',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "flavor" TEXT NOT NULL,
    "messageOnCake" TEXT,
    "pickupDate" TEXT NOT NULL,
    "pickupTime" TEXT,
    "inspirationUrl" TEXT,
    "budget" TEXT,
    "allergies" TEXT,
    "details" TEXT NOT NULL,

    CONSTRAINT "CustomCakeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomCakeRequest_reference_key" ON "CustomCakeRequest"("reference");

-- CreateIndex
CREATE INDEX "CustomCakeRequest_email_idx" ON "CustomCakeRequest"("email");
