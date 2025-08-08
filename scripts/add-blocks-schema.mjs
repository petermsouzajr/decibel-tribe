import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Ensuring blocks table exists...");
    await prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS "blocks" (
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("blockerId","blockedId")
);
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'blocks_blocker_fkey'
  ) THEN
    ALTER TABLE "blocks"
      ADD CONSTRAINT blocks_blocker_fkey FOREIGN KEY ("blockerId") REFERENCES "users"(id) ON DELETE CASCADE;
  END IF;
END$$;`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'blocks_blocked_fkey'
  ) THEN
    ALTER TABLE "blocks"
      ADD CONSTRAINT blocks_blocked_fkey FOREIGN KEY ("blockedId") REFERENCES "users"(id) ON DELETE CASCADE;
  END IF;
END$$;`);

    console.log("✅ Blocks table ensured.");
  } catch (e) {
    console.error("❌ Failed ensuring blocks table:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();


