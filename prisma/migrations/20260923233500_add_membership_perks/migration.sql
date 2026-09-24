-- AlterTable
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "hasPersonPerks" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "hasIdPerks" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "user_dating_identity_verifications_stripeCustomerId_idx" ON "user_dating_identity_verifications"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "user_dating_identity_verifications_stripeSubscriptionId_idx" ON "user_dating_identity_verifications"("stripeSubscriptionId");
