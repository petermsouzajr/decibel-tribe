# Dating Feature Database Migration Notes

## Required Migrations

To enable the dating feature, you need to run the following Prisma migrations:

### 1. Add MATCH to NotificationType enum
```sql
ALTER TYPE "NotificationType" ADD VALUE 'MATCH';
```

### 2. Add message field to swipes table
```sql
ALTER TABLE "swipes" ADD COLUMN "message" TEXT;
```

### 3. Create Message model for dating matches
```sql
CREATE TABLE "messages" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_matchId_createdAt_idx" ON "messages"("matchId", "createdAt");

ALTER TABLE "messages" ADD CONSTRAINT "messages_matchId_fkey" 
  FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" 
  FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Running Migrations

Run the following command to generate and apply migrations:

```bash
npx prisma migrate dev --name add_dating_features
```

Or if you prefer to create the migration manually:

```bash
npx prisma migrate dev --create-only --name add_dating_features
# Then edit the migration file and run:
npx prisma migrate dev
```

## Verification

After running migrations, verify the changes:

1. Check that `MATCH` is in the NotificationType enum
2. Check that `swipes` table has a `message` column
3. Check that `messages` table exists with proper indexes
4. Verify foreign key constraints are in place

## Notes

- The Message model is separate from Stream Chat messages
- Messages are linked to matches via `matchId`
- Read receipts are tracked per message
- Messages are automatically deleted when a match is deleted (CASCADE)













