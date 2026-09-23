import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const paused = body?.paused;
    if (typeof paused !== "boolean") {
      return NextResponse.json({ error: "paused must be true or false" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { datingPausedAt: paused ? new Date() : null },
      select: { datingPausedAt: true },
    });

    return NextResponse.json({ datingPaused: updated.datingPausedAt !== null });
  } catch (error) {
    console.error("Error updating dating pause:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
