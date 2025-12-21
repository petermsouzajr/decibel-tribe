-- AlterTable: Change preferredActivity from String? to String[]
-- First, create a temporary column
ALTER TABLE "user_dating_preferences" ADD COLUMN IF NOT EXISTS "preferredActivity_new" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing data: convert single string values to arrays
UPDATE "user_dating_preferences" 
SET "preferredActivity_new" = CASE 
  WHEN "preferredActivity" IS NOT NULL AND "preferredActivity" != '' THEN ARRAY["preferredActivity"]
  ELSE ARRAY[]::TEXT[]
END
WHERE "preferredActivity_new" IS NULL;

-- Drop the old column
ALTER TABLE "user_dating_preferences" DROP COLUMN IF EXISTS "preferredActivity";

-- Rename the new column to the original name
ALTER TABLE "user_dating_preferences" RENAME COLUMN "preferredActivity_new" TO "preferredActivity";
