import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { grantIdSuperstarIfNeeded } from "@/lib/dating/idReward";
import {
  ATTEMPT_SECONDS,
  MAX_ATTEMPTS_PER_DAY,
  MIN_PROFILE_PHOTOS,
  POSE_SECONDS,
  pickPoses,
  poseById,
} from "@/lib/dating/poses";
import {
  dailyLikeCap,
  rewindLimit,
  verificationTier,
} from "@/lib/dating/verificationTier";
import { judgePosesWithGrok, verdictPasses } from "@/lib/dating/grokVision";
import { NextRequest, NextResponse } from "next/server";

function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function flagsFor(userId: string) {
  const row = await prisma.userDatingIdentityVerification.findUnique({
    where: { userId },
    select: {
      isPersonVerified: true,
      isIDVerified: true,
      hasPersonPerks: true,
      hasIdPerks: true,
    },
  });
  const flags = {
    isPersonVerified: row?.isPersonVerified ?? false,
    isIDVerified: row?.isIDVerified ?? false,
    hasPersonPerks: row?.hasPersonPerks ?? false,
    hasIdPerks: row?.hasIdPerks ?? false,
  };
  const tier = verificationTier(flags);
  return {
    ...flags,
    tier,
    dailyLikeCap: dailyLikeCap(tier),
    rewindLimit: rewindLimit(tier),
  };
}

export async function GET() {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await grantIdSuperstarIfNeeded(user.id);
    return NextResponse.json(await flagsFor(user.id));
  } catch (error) {
    console.error("Error reading verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const photos = await prisma.userDatingPhoto.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    if (photos.length < MIN_PROFILE_PHOTOS) {
      return NextResponse.json(
        { error: "Add at least 3 profile photos before verifying." },
        { status: 400 },
      );
    }

    const today = startOfUtcDay();
    const existing = await prisma.userDatingIdentityVerification.findUnique({
      where: { userId: user.id },
    });
    const sameDay = existing?.poseAttemptsOn && startOfUtcDay(existing.poseAttemptsOn).getTime() === today.getTime();
    const attempts = sameDay ? existing?.poseAttemptsCount ?? 0 : 0;
    if (attempts >= MAX_ATTEMPTS_PER_DAY) {
      return NextResponse.json(
        { error: "You can try person verification again tomorrow." },
        { status: 429 },
      );
    }

    const poses = pickPoses(3);
    const startedAt = new Date();
    await prisma.userDatingIdentityVerification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        poseSessionPoses: poses.map((pose) => pose.id),
        poseSessionStartedAt: startedAt,
        poseAttemptsOn: today,
        poseAttemptsCount: 1,
      },
      update: {
        poseSessionPoses: poses.map((pose) => pose.id),
        poseSessionStartedAt: startedAt,
        poseAttemptsOn: today,
        poseAttemptsCount: attempts + 1,
      },
    });

    return NextResponse.json({
      poses,
      poseSeconds: POSE_SECONDS,
      attemptSeconds: ATTEMPT_SECONDS,
      startedAt: startedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error starting person verification:", error);
    return NextResponse.json({ error: "Could not start verification." }, { status: 500 });
  }
}

async function fileToImage(file: FormDataEntryValue | null): Promise<{ base64: string; mediaType: string } | null> {
  if (!(file instanceof File)) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.length) return null;
  return {
    base64: bytes.toString("base64"),
    mediaType: file.type || "image/jpeg",
  };
}

async function urlToImage(url: string): Promise<{ base64: string; mediaType: string } | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    base64: bytes.toString("base64"),
    mediaType: response.headers.get("content-type")?.split(";")[0] || "image/jpeg",
  };
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await request.formData();
    const identity = await prisma.userDatingIdentityVerification.findUnique({
      where: { userId: user.id },
    });
    if (!identity?.poseSessionStartedAt || identity.poseSessionPoses.length !== 3) {
      return NextResponse.json({ error: "Start a verification before submitting photos." }, { status: 400 });
    }
    if (Date.now() - identity.poseSessionStartedAt.getTime() > ATTEMPT_SECONDS * 1000) {
      return NextResponse.json(
        { error: "That attempt expired. Start again and take the three photos a little faster." },
        { status: 400 },
      );
    }

    const poses = [];
    for (let index = 0; index < identity.poseSessionPoses.length; index += 1) {
      const pose = poseById(identity.poseSessionPoses[index]);
      const image = await fileToImage(form.get(`pose${index}`));
      if (!pose || !image) {
        return NextResponse.json({ error: "Three pose photos are required." }, { status: 400 });
      }
      poses.push({ label: pose.instruction, ...image });
    }

    const profilePhotos = await prisma.userDatingPhoto.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 6,
    });
    if (profilePhotos.length < MIN_PROFILE_PHOTOS) {
      return NextResponse.json(
        { error: "Add at least 3 profile photos before verifying." },
        { status: 400 },
      );
    }

    const profiles = [];
    for (const photo of profilePhotos) {
      const image = await urlToImage(photo.url);
      if (image) profiles.push({ label: "profile", ...image });
    }
    if (profiles.length < MIN_PROFILE_PHOTOS) {
      return NextResponse.json({ error: "Could not read your profile photos." }, { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Person verification is not configured." }, { status: 503 });
    }

    const verdict = await judgePosesWithGrok({
      apiKey,
      model: process.env.XAI_VISION_MODEL || "grok-2-vision-1212",
      poses,
      profiles,
    });
    const passed = verdictPasses(verdict);

    await prisma.userDatingIdentityVerification.update({
      where: { userId: user.id },
      data: passed
        ? {
            isPersonVerified: true,
            personVerifiedAt: new Date(),
            personVerifiedPhotoIds: profilePhotos.map((photo) => photo.id),
            poseSessionPoses: [],
            poseSessionStartedAt: null,
          }
        : {
            poseSessionPoses: [],
            poseSessionStartedAt: null,
          },
    });

    if (!passed) {
      return NextResponse.json(
        { error: "Those photos did not match. Try again with your face clearly visible.", passed: false },
        { status: 422 },
      );
    }

    return NextResponse.json({ ...(await flagsFor(user.id)), passed: true });
  } catch (error) {
    console.error("Error checking person verification:", error);
    return NextResponse.json({ error: "Could not check those photos." }, { status: 500 });
  }
}
