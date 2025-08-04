import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json(
      {
        message: `${expiredVerifications.length} expired verification token(s) deleted.`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting expired verification tokens:", error);
    return NextResponse.json(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
      },
    );
  }
}
