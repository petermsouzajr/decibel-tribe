/*
  Warnings:

  - You are about to drop the column `isVerified` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_isVerified_isDatingActive_deletedAt_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isVerified",
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "users_isEmailVerified_isDatingActive_deletedAt_idx" ON "users"("isEmailVerified", "isDatingActive", "deletedAt");
