-- AlterTable: Change preferredActivity from String? to String[]
-- Step 1: Add new column as TEXT[]
ALTER TABLE "user_dating_preferences" ADD COLUMN IF NOT EXISTS "preferredActivity_temp" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing data: convert single string values to arrays
UPDATE "user_dating_preferences" 
SET "preferredActivity_temp" = CASE 
  WHEN "preferredActivity" IS NOT NULL AND "preferredActivity" != '' THEN ARRAY["preferredActivity"]
  ELSE ARRAY[]::TEXT[]
END;

-- Step 3: Drop the old column
ALTER TABLE "user_dating_preferences" DROP COLUMN IF EXISTS "preferredActivity";

-- Step 4: Rename the new column to the original name
ALTER TABLE "user_dating_preferences" RENAME COLUMN "preferredActivity_temp" TO "preferredActivity";
