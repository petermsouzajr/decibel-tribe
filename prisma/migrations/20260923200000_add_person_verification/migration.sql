-- AlterTable
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "isPersonVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "personVerifiedAt" TIMESTAMP(3);
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "personVerifiedPhotoIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "idSuperstarGranted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "poseSessionPoses" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "poseSessionStartedAt" TIMESTAMP(3);
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "poseAttemptsOn" TIMESTAMP(3);
ALTER TABLE "user_dating_identity_verifications" ADD COLUMN "poseAttemptsCount" INTEGER NOT NULL DEFAULT 0;
