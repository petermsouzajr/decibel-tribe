-- Appearance lookup tables and the private labels stored per member.
-- Clothing and setting are inputs. Filters read the other five groups by slug.

ALTER TABLE "user_dating_preferences" ADD COLUMN "preferredEyeColors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "user_dating_preferences" ADD COLUMN "preferredHairColors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "user_dating_preferences" ADD COLUMN "preferredHairStyles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "user_dating_preferences" ADD COLUMN "preferredFacialHair" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "user_dating_preferences" ADD COLUMN "preferredAppearances" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "eye_color" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    CONSTRAINT "eye_color_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "eye_color_slug_key" ON "eye_color"("slug");

CREATE TABLE "user_eye_color" (
    "userId" TEXT NOT NULL,
    "eyeColorId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    CONSTRAINT "user_eye_color_pkey" PRIMARY KEY ("userId")
);
CREATE TABLE "hair_color" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    CONSTRAINT "hair_color_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hair_color_slug_key" ON "hair_color"("slug");
CREATE TABLE "user_hair_color" (
    "userId" TEXT NOT NULL,
    "hairColorId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    CONSTRAINT "user_hair_color_pkey" PRIMARY KEY ("userId","hairColorId")
);
CREATE TABLE "hair_style" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    CONSTRAINT "hair_style_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hair_style_slug_key" ON "hair_style"("slug");
CREATE TABLE "user_hair_style" (
    "userId" TEXT NOT NULL,
    "hairStyleId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    CONSTRAINT "user_hair_style_pkey" PRIMARY KEY ("userId","hairStyleId")
);
CREATE TABLE "facial_hair" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    CONSTRAINT "facial_hair_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "facial_hair_slug_key" ON "facial_hair"("slug");
CREATE TABLE "user_facial_hair" (
    "userId" TEXT NOT NULL,
    "facialHairId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    CONSTRAINT "user_facial_hair_pkey" PRIMARY KEY ("userId")
);
CREATE TABLE "appearance" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    CONSTRAINT "appearance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "appearance_slug_key" ON "appearance"("slug");
CREATE TABLE "user_appearance" (
    "userId" TEXT NOT NULL,
    "appearanceId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    CONSTRAINT "user_appearance_pkey" PRIMARY KEY ("userId","appearanceId")
);
CREATE TABLE "clothing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    CONSTRAINT "clothing_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "clothing_slug_key" ON "clothing"("slug");
CREATE TABLE "user_clothing" (
    "userId" TEXT NOT NULL,
    "clothingId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    CONSTRAINT "user_clothing_pkey" PRIMARY KEY ("userId","clothingId")
);
CREATE TABLE "setting" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "setting_slug_key" ON "setting"("slug");
CREATE TABLE "user_setting" (
    "userId" TEXT NOT NULL,
    "settingId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    CONSTRAINT "user_setting_pkey" PRIMARY KEY ("userId","settingId")
);
CREATE TABLE "appearance_run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appearance_run_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "appearance_run_userId_createdAt_idx" ON "appearance_run"("userId", "createdAt");
CREATE TABLE "appearance_run_group" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "appearance_run_group_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "appearance_run_group_runId_idx" ON "appearance_run_group"("runId");

ALTER TABLE "user_eye_color" ADD CONSTRAINT "user_eye_color_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_eye_color" ADD CONSTRAINT "user_eye_color_eyeColorId_fkey" FOREIGN KEY ("eyeColorId") REFERENCES "eye_color"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_hair_color" ADD CONSTRAINT "user_hair_color_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_hair_color" ADD CONSTRAINT "user_hair_color_hairColorId_fkey" FOREIGN KEY ("hairColorId") REFERENCES "hair_color"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_hair_style" ADD CONSTRAINT "user_hair_style_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_hair_style" ADD CONSTRAINT "user_hair_style_hairStyleId_fkey" FOREIGN KEY ("hairStyleId") REFERENCES "hair_style"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_facial_hair" ADD CONSTRAINT "user_facial_hair_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_facial_hair" ADD CONSTRAINT "user_facial_hair_facialHairId_fkey" FOREIGN KEY ("facialHairId") REFERENCES "facial_hair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_appearance" ADD CONSTRAINT "user_appearance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_appearance" ADD CONSTRAINT "user_appearance_appearanceId_fkey" FOREIGN KEY ("appearanceId") REFERENCES "appearance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_clothing" ADD CONSTRAINT "user_clothing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_clothing" ADD CONSTRAINT "user_clothing_clothingId_fkey" FOREIGN KEY ("clothingId") REFERENCES "clothing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_setting" ADD CONSTRAINT "user_setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_setting" ADD CONSTRAINT "user_setting_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "setting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appearance_run" ADD CONSTRAINT "appearance_run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appearance_run_group" ADD CONSTRAINT "appearance_run_group_runId_fkey" FOREIGN KEY ("runId") REFERENCES "appearance_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
