-- AlterTable
ALTER TABLE "swipes" ADD COLUMN "isSuperstar" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "swipes" ADD COLUMN "superstarAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_dating_preferences" ADD COLUMN "superstarBalance" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "user_dating_preferences" ADD COLUMN "superstarNextAt" TIMESTAMP(3);
