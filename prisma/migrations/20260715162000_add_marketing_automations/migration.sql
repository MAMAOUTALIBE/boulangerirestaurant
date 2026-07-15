ALTER TABLE "Customer" ADD COLUMN "birthDate" TIMESTAMP(3);

CREATE TABLE "MarketingRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "promoCode" TEXT,
  "delayDays" INTEGER,
  "weekday" INTEGER,
  "weatherKind" TEXT,
  "lastRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketingRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketingCampaign" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "promoCode" TEXT,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketingDispatch" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'envoyé',
  "dedupeKey" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingDispatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketingRule_enabled_idx" ON "MarketingRule"("enabled");
CREATE INDEX "MarketingRule_type_idx" ON "MarketingRule"("type");
CREATE INDEX "MarketingCampaign_ruleId_idx" ON "MarketingCampaign"("ruleId");
CREATE INDEX "MarketingCampaign_sentAt_idx" ON "MarketingCampaign"("sentAt");
CREATE INDEX "MarketingCampaign_promoCode_idx" ON "MarketingCampaign"("promoCode");
CREATE UNIQUE INDEX "MarketingDispatch_dedupeKey_key" ON "MarketingDispatch"("dedupeKey");
CREATE INDEX "MarketingDispatch_campaignId_idx" ON "MarketingDispatch"("campaignId");
CREATE INDEX "MarketingDispatch_email_idx" ON "MarketingDispatch"("email");
CREATE INDEX "MarketingDispatch_sentAt_idx" ON "MarketingDispatch"("sentAt");

ALTER TABLE "MarketingCampaign"
  ADD CONSTRAINT "MarketingCampaign_ruleId_fkey"
  FOREIGN KEY ("ruleId") REFERENCES "MarketingRule"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MarketingDispatch"
  ADD CONSTRAINT "MarketingDispatch_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
