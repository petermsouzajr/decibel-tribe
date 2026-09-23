import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { createDocumentSession } from "@/lib/dating/stripeIdentity";
import { NextResponse } from "next/server";

const URL_FRESH_MS = 24 * 60 * 60 * 1000;

function publicStatus(row: {
  isIDVerified: boolean;
  verificationStatus: string;
  failureReason: string | null;
  verifiedAt: Date | null;
} | null) {
  return {
    isIDVerified: row?.isIDVerified ?? false,
    status: row?.verificationStatus ?? "not_started",
    failureReason: row?.failureReason ?? null,
    verifiedAt: row?.verifiedAt?.toISOString() ?? null,
  };
}

export async function GET() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const row = await prisma.userDatingIdentityVerification.findUnique({
      where: { userId: user.id },
    });
    return NextResponse.json(publicStatus(row));
  } catch (error) {
    console.error("Error reading ID verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.userDatingIdentityVerification.findUnique({
      where: { userId: user.id },
    });
    if (existing?.isIDVerified) {
      return NextResponse.json(publicStatus(existing));
    }

    const urlIsFresh =
      existing?.verificationStatus === "pending" &&
      existing.stripeVerificationUrl &&
      existing.lastAttemptAt &&
      Date.now() - existing.lastAttemptAt.getTime() < URL_FRESH_MS;
    if (urlIsFresh) {
      return NextResponse.json({ ...publicStatus(existing), url: existing.stripeVerificationUrl });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe Identity is not configured." }, { status: 503 });
    }

    const returnUrl = process.env.STRIPE_IDENTITY_RETURN_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.decibeltribe.com";
    const session = await createDocumentSession({
      secretKey,
      userId: user.id,
      returnUrl,
    });

    const row = await prisma.userDatingIdentityVerification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isIDVerified: false,
        verificationStatus: "pending",
        verificationMethod: "stripe_identity",
        stripeVerificationId: session.id,
        stripeVerificationUrl: session.url,
        attemptsCount: 1,
        lastAttemptAt: new Date(),
      },
      update: {
        verificationStatus: "pending",
        verificationMethod: "stripe_identity",
        stripeVerificationId: session.id,
        stripeVerificationUrl: session.url,
        failureReason: null,
        attemptsCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    return NextResponse.json({ ...publicStatus(row), url: session.url });
  } catch (error) {
    console.error("Error starting ID verification:", error);
    return NextResponse.json({ error: "Could not start ID verification." }, { status: 500 });
  }
}
