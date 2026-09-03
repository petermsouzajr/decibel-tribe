-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_dating_preferences" ALTER COLUMN "idVerificationFilter" SET DEFAULT 'show_id_verified_only';
