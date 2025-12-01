-- Add undoExpiresAt to swipes table for undo functionality
ALTER TABLE "swipes" ADD COLUMN IF NOT EXISTS "undoExpiresAt" TIMESTAMP(3);

-- Create dating_location_overrides table for travel mode
CREATE TABLE IF NOT EXISTS "dating_location_overrides" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dating_location_overrides_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on userId for dating_location_overrides
CREATE UNIQUE INDEX IF NOT EXISTS "dating_location_overrides_userId_key" ON "dating_location_overrides"("userId");

-- Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dating_location_overrides_userId_fkey'
    ) THEN
        ALTER TABLE "dating_location_overrides" ADD CONSTRAINT "dating_location_overrides_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS "swipes_fromUserId_idx" ON "swipes"("fromUserId");
CREATE INDEX IF NOT EXISTS "swipes_toUserId_idx" ON "swipes"("toUserId");
CREATE INDEX IF NOT EXISTS "swipes_fromUserId_createdAt_idx" ON "swipes"("fromUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "swipes_direction_createdAt_idx" ON "swipes"("direction", "createdAt");

CREATE INDEX IF NOT EXISTS "matches_user1Id_idx" ON "matches"("user1Id");
CREATE INDEX IF NOT EXISTS "matches_user2Id_idx" ON "matches"("user2Id");
CREATE INDEX IF NOT EXISTS "matches_user1Id_createdAt_idx" ON "matches"("user1Id", "createdAt");
CREATE INDEX IF NOT EXISTS "matches_user2Id_createdAt_idx" ON "matches"("user2Id", "createdAt");

CREATE INDEX IF NOT EXISTS "blocks_blockerId_idx" ON "blocks"("blockerId");
CREATE INDEX IF NOT EXISTS "blocks_blockedId_idx" ON "blocks"("blockedId");

CREATE INDEX IF NOT EXISTS "user_photos_userId_idx" ON "user_photos"("userId");
CREATE INDEX IF NOT EXISTS "user_photos_userId_isPrimary_idx" ON "user_photos"("userId", "isPrimary");

CREATE INDEX IF NOT EXISTS "users_isVerified_isDatingActive_deletedAt_idx" ON "users"("isVerified", "isDatingActive", "deletedAt");


