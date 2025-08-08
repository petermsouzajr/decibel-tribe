import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Ensuring share columns exist on posts...");
    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'sharedFromId'
  ) THEN
    ALTER TABLE "posts" ADD COLUMN "sharedFromId" TEXT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'sharedCount'
  ) THEN
    ALTER TABLE "posts" ADD COLUMN "sharedCount" INTEGER NOT NULL DEFAULT 0;
  END IF;
END$$;`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'posts_sharedfrom_fkey'
  ) THEN
    ALTER TABLE "posts" ADD CONSTRAINT posts_sharedfrom_fkey FOREIGN KEY ("sharedFromId") REFERENCES "posts"(id) ON DELETE SET NULL;
  END IF;
END$$;`);
    console.log("✅ Share columns ensured.");
  } catch (e) {
    console.error("❌ Failed ensuring share columns:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();


