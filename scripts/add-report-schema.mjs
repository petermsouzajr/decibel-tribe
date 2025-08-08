import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Starting safe Report schema setup...");

    // Create enums if they don't exist
    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportReason') THEN
    CREATE TYPE "ReportReason" AS ENUM ('HARASSMENT','VIOLENCE','SPAM','INAPPROPRIATE_CONTENT','FAKE_PROFILE','OTHER');
  END IF;
END$$;
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportStatus') THEN
    CREATE TYPE "ReportStatus" AS ENUM ('PENDING','INVESTIGATING','RESOLVED_ACTION_TAKEN','RESOLVED_NO_ACTION','DISMISSED');
  END IF;
END$$;
`);

    // Create table with quoted CamelCase columns if not exists
    await prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS "reports" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporterId"   TEXT NOT NULL,
  "reportedId"   TEXT NULL,
  "postId"       TEXT NULL,
  "commentId"    TEXT NULL,
  "messageId"    TEXT NULL,
  "groupId"      TEXT NULL,
  "eventId"      TEXT NULL,
  reason       "ReportReason" NOT NULL,
  description  TEXT NULL,
  status       "ReportStatus" NOT NULL DEFAULT 'PENDING',
  "adminNotes"   TEXT NULL,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "resolvedAt"   TIMESTAMPTZ NULL,
  "resolvedBy"   TEXT NULL
);
`);

    // Rename lowercase columns to CamelCase if needed
    const renames = [
      ['reporterid', 'reporterId'],
      ['reportedid', 'reportedId'],
      ['postid', 'postId'],
      ['messageid', 'messageId'],
      ['groupid', 'groupId'],
      ['eventid', 'eventId'],
      ['createdat', 'createdAt'],
      ['updatedat', 'updatedAt'],
      ['resolvedat', 'resolvedAt'],
      ['resolvedby', 'resolvedBy'],
      ['adminnotes', 'adminNotes'],
    ];

    for (const [from, to] of renames) {
      await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = '${from}'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = '${to}'
  ) THEN
    EXECUTE format('ALTER TABLE "reports" RENAME COLUMN %I TO %I', '${from}', '${to}');
  END IF;
END$$;`);
    }

    // Ensure updatedAt trigger exists (CamelCase)
    await prisma.$executeRawUnsafe(`
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ language 'plpgsql';
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'reports_updated_at'
  ) THEN
    CREATE TRIGGER reports_updated_at
      BEFORE UPDATE ON "reports"
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
END$$;
`);

    // Add FKs if not already present
    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reports_reporter_fkey'
  ) THEN
    ALTER TABLE "reports"
      ADD CONSTRAINT reports_reporter_fkey FOREIGN KEY ("reporterId") REFERENCES "users"(id) ON DELETE CASCADE;
  END IF;
END$$;
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reports_reported_fkey'
  ) THEN
    ALTER TABLE "reports"
      ADD CONSTRAINT reports_reported_fkey FOREIGN KEY ("reportedId") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
END$$;
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  -- Ensure commentId column exists if table already existed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'commentId'
  ) THEN
    -- do nothing
  ELSE
    ALTER TABLE "reports" ADD COLUMN "commentId" TEXT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reports_post_fkey'
  ) THEN
    ALTER TABLE "reports"
      ADD CONSTRAINT reports_post_fkey FOREIGN KEY ("postId") REFERENCES "posts"(id) ON DELETE SET NULL;
  END IF;
END$$;
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reports_comment_fkey'
  ) THEN
    ALTER TABLE "reports"
      ADD CONSTRAINT reports_comment_fkey FOREIGN KEY ("commentId") REFERENCES "comments"(id) ON DELETE SET NULL;
  END IF;
END$$;
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups') AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reports_group_fkey'
  ) THEN
    ALTER TABLE "reports"
      ADD CONSTRAINT reports_group_fkey FOREIGN KEY ("groupId") REFERENCES "groups"(id) ON DELETE SET NULL;
  END IF;
END$$;
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reports_event_fkey'
  ) THEN
    ALTER TABLE "reports"
      ADD CONSTRAINT reports_event_fkey FOREIGN KEY ("eventId") REFERENCES "events"(id) ON DELETE SET NULL;
  END IF;
END$$;
`);

    // Indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_reports_status ON "reports"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_reports_created_at ON "reports"("createdAt");`);

    console.log("✅ Report schema ensured safely.");
  } catch (error) {
    console.error("❌ Error setting up Report schema:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
