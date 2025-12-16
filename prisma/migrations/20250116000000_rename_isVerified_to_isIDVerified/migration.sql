-- Rename isVerified to isIDVerified in user_dating_identity_verifications table
-- Note: Model names changed to PascalCase (Match, Swipe, UserDatingProfile, etc.) 
-- but table names remain the same via @@map() directives, so no table renames needed.
-- This migration only renames the column to match the new schema field name.

ALTER TABLE "user_dating_identity_verifications" RENAME COLUMN "isVerified" TO "isIDVerified";

-- Update the index to use the new column name
DROP INDEX IF EXISTS "user_dating_identity_verifications_userId_isVerified_idx";
CREATE INDEX IF NOT EXISTS "user_dating_identity_verifications_userId_isIDVerified_idx" ON "user_dating_identity_verifications"("userId", "isIDVerified");
