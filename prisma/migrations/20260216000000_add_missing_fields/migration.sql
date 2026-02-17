-- CreateEnum
CREATE TYPE "ModerationReportEntityType" AS ENUM ('USER', 'POST', 'PHOTO', 'MESSAGE');

-- CreateEnum
CREATE TYPE "ModerationReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- CreateEnum
CREATE TYPE "ModerationBanType" AS ENUM ('TEMPORARY', 'PERMANENT', 'SHADOW');

-- CreateEnum
CREATE TYPE "ModerationBanStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'APPEALED', 'LIFTED');

-- CreateEnum
CREATE TYPE "ModerationAppealStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "zipCode" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "zipCode" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "banned_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_dating_preferences" ADD COLUMN "preferredBodyType" TEXT,
ADD COLUMN "preferredPets" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "user_dating_profiles" ADD COLUMN "bodyType" TEXT;

-- AlterTable user_dating_profiles change pets column
ALTER TABLE "user_dating_profiles" DROP COLUMN "pets";
ALTER TABLE "user_dating_profiles" ADD COLUMN "pets" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "event_help_wanted_skills" (
    "eventId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "event_help_wanted_skills_pkey" PRIMARY KEY ("eventId","skillId")
);

-- CreateTable
CREATE TABLE "moderation_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "reportedType" "ModerationReportEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ModerationReportStatus" NOT NULL DEFAULT 'PENDING',
    "actionTaken" TEXT,
    "moderatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_bans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "banType" "ModerationBanType" NOT NULL DEFAULT 'TEMPORARY',
    "durationDays" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "status" "ModerationBanStatus" NOT NULL DEFAULT 'ACTIVE',
    "moderatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_ban_reports" (
    "banId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "moderation_ban_reports_pkey" PRIMARY KEY ("banId","reportId")
);

-- CreateTable
CREATE TABLE "moderation_appeals" (
    "id" TEXT NOT NULL,
    "banId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" "ModerationAppealStatus" NOT NULL DEFAULT 'PENDING',
    "moderatorNotes" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_action_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "targetUserId" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_help_wanted_skills_skillId_idx" ON "event_help_wanted_skills"("skillId");

-- CreateIndex
CREATE INDEX "events_zipCode_idx" ON "events"("zipCode");

-- CreateIndex
CREATE INDEX "events_latitude_longitude_idx" ON "events"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "moderation_reports_reporterId_idx" ON "moderation_reports"("reporterId");

-- CreateIndex
CREATE INDEX "moderation_reports_reportedUserId_reportedType_idx" ON "moderation_reports"("reportedUserId", "reportedType");

-- CreateIndex
CREATE INDEX "moderation_reports_reportedType_entityId_idx" ON "moderation_reports"("reportedType", "entityId");

-- CreateIndex
CREATE INDEX "moderation_reports_status_createdAt_idx" ON "moderation_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_bans_userId_idx" ON "moderation_bans"("userId");

-- CreateIndex
CREATE INDEX "moderation_bans_userId_status_idx" ON "moderation_bans"("userId", "status");

-- CreateIndex
CREATE INDEX "moderation_bans_expiresAt_idx" ON "moderation_bans"("expiresAt");

-- CreateIndex
CREATE INDEX "moderation_bans_status_idx" ON "moderation_bans"("status");

-- CreateIndex
CREATE INDEX "moderation_ban_reports_reportId_idx" ON "moderation_ban_reports"("reportId");

-- CreateIndex
CREATE INDEX "moderation_appeals_banId_idx" ON "moderation_appeals"("banId");

-- CreateIndex
CREATE INDEX "moderation_appeals_userId_idx" ON "moderation_appeals"("userId");

-- CreateIndex
CREATE INDEX "moderation_appeals_status_idx" ON "moderation_appeals"("status");

-- CreateIndex
CREATE INDEX "moderation_action_logs_actorId_createdAt_idx" ON "moderation_action_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_action_logs_targetUserId_createdAt_idx" ON "moderation_action_logs"("targetUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "event_help_wanted_skills" ADD CONSTRAINT "event_help_wanted_skills_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_help_wanted_skills" ADD CONSTRAINT "event_help_wanted_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_bans" ADD CONSTRAINT "moderation_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_bans" ADD CONSTRAINT "moderation_bans_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_ban_reports" ADD CONSTRAINT "moderation_ban_reports_banId_fkey" FOREIGN KEY ("banId") REFERENCES "moderation_bans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_ban_reports" ADD CONSTRAINT "moderation_ban_reports_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "moderation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_banId_fkey" FOREIGN KEY ("banId") REFERENCES "moderation_bans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_action_logs" ADD CONSTRAINT "moderation_action_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_action_logs" ADD CONSTRAINT "moderation_action_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
