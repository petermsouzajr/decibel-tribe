import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check for cron job authorization (simple header check)
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentDate = new Date();

    const unverifiedUsers = await prisma.user.findMany({
      where: {
        isEmailVerified: false,
        googleId: null,
        createdAt: {
          lte: new Date(currentDate.getTime() - 1000 * 60 * 60 * 24 * 14),
        },
      },
      select: {
        id: true,
      },
    });

    if (unverifiedUsers.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: unverifiedUsers.map((user) => user.id),
          },
        },
      });
    }

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const expiredVerifications = await prisma.emailVerification.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (expiredVerifications.length > 0) {
      await prisma.emailVerification.deleteMany({
        where: {
          id: {
            in: expiredVerifications.map((verifications) => verifications.id),
          },
        },
      });
    }

    return new Response(
      JSON.stringify({
        message: `${expiredVerifications.length} expired verification token(s) and ${unverifiedUsers.length} unverified user(s) deleted..`,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting unverified users:", error);
    return serverError();
  }
}
