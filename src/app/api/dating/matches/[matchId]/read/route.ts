import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ matchId: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = await props.params;

    // Get the match to determine which user field to update
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      select: { user1Id: true, user2Id: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is part of this match
    if (match.user1Id !== user.id && match.user2Id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the appropriate lastViewedAt field
    const updateData: { user1LastViewedAt?: Date; user2LastViewedAt?: Date } = {};
    if (match.user1Id === user.id) {
      updateData.user1LastViewedAt = new Date();
    } else {
      updateData.user2LastViewedAt = new Date();
    }

    await prisma.matches.update({
      where: { id: matchId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking match as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

