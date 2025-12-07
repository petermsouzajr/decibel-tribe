import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if dating is active
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isDatingActive: true },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // "liked", "disliked", "all"

    // Build where clause based on type
    const whereClause: any = {
      fromUserId: user.id,
    };

    if (type === "liked") {
      whereClause.direction = "LIKE";
    } else if (type === "disliked") {
      whereClause.direction = "DISLIKE";
    }

    // Get swipe history
    const swipes = await prisma.swipes.findMany({
      where: whereClause,
      include: {
        users_swipes_toUserIdTousers: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            user_dating_profile: {
              select: {
                age: true,
                city: true,
                zipCode: true,
              },
            },
            user_photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 swipes
    });

    // Check which ones are now matches (can be unliked)
    const matchedUserIds = await prisma.matches.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    }).then((matches) =>
      matches.map((m) => (m.user1Id === user.id ? m.user2Id : m.user1Id))
    );

    // Format response
    const formattedSwipes = swipes.map((swipe) => {
      const targetUser = swipe.users_swipes_toUserIdTousers;
      const isMatched = matchedUserIds.includes(targetUser.id);

      return {
        id: swipe.id,
        userId: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        avatarUrl: targetUser.avatarUrl,
        primaryPhotoUrl: targetUser.user_photos[0]?.url || targetUser.avatarUrl,
        age: targetUser.user_dating_profile?.age || null,
        location: targetUser.user_dating_profile?.city || targetUser.user_dating_profile?.zipCode || null,
        direction: swipe.direction,
        message: swipe.message || null,
        createdAt: swipe.createdAt,
        canUnlike: swipe.direction === "LIKE" && !isMatched && (() => {
          // Can unlike if liked, not matched, and within 3 hours
          const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
          return swipe.createdAt >= threeHoursAgo;
        })(), // Can unlike if liked, not matched, and within 3-hour window
      };
    });

    return NextResponse.json({ swipes: formattedSwipes });
  } catch (error) {
    console.error("Error fetching swipe history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const swipeId = searchParams.get("swipeId");

    if (!swipeId) {
      return NextResponse.json(
        { error: "swipeId is required" },
        { status: 400 }
      );
    }

    // Verify the swipe belongs to the current user
    const swipe = await prisma.swipes.findUnique({
      where: { id: swipeId },
    });

    if (!swipe || swipe.fromUserId !== user.id) {
      return NextResponse.json(
        { error: "Swipe not found or unauthorized" },
        { status: 404 }
      );
    }

    // Can only unlike if it was a LIKE and not matched
    if (swipe.direction !== "LIKE") {
      return NextResponse.json(
        { error: "Can only unlike likes" },
        { status: 400 }
      );
    }

    // Check if matched
    const isMatched = await prisma.matches.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: swipe.toUserId },
          { user1Id: swipe.toUserId, user2Id: user.id },
        ],
      },
    });

    if (isMatched) {
      return NextResponse.json(
        { error: "Cannot unlike a matched user" },
        { status: 400 }
      );
    }

    // Check 3-hour window
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    if (swipe.createdAt < threeHoursAgo) {
      return NextResponse.json(
        { error: "Can only undo swipes within 3 hours" },
        { status: 400 }
      );
    }

    // Delete the swipe
    await prisma.swipes.delete({
      where: { id: swipeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unliking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

