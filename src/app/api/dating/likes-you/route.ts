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
      select: { isVerified: true, isDatingActive: true },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    // Get all users who have matched with current user
    const existingMatches = await prisma.matches.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    });
    const matchedUserIds = existingMatches.map((m) =>
      m.user1Id === user.id ? m.user2Id : m.user1Id
    );

    // Get all users who have liked the current user (but haven't been matched yet)
    const likesReceived = await prisma.swipes.findMany({
      where: {
        toUserId: user.id,
        direction: "LIKE",
        // Exclude if we've already matched
        fromUserId: {
          notIn: matchedUserIds,
        },
      },
      include: {
        users_swipes_fromUserIdTousers: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            user_dating_profile: {
              select: {
                age: true,
                height: true,
                gender: true,
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
    });

    // Format response
    const formattedLikes = likesReceived.map((swipe) => {
      const liker = swipe.users_swipes_fromUserIdTousers;
      return {
        id: liker.id,
        username: liker.username,
        displayName: liker.displayName,
        avatarUrl: liker.avatarUrl,
        primaryPhotoUrl: liker.user_photos[0]?.url || liker.avatarUrl,
        age: liker.user_dating_profile?.age || null,
        height: liker.user_dating_profile?.height || null,
        gender: liker.user_dating_profile?.gender || null,
        location: liker.user_dating_profile?.city || liker.user_dating_profile?.zipCode || null,
        likedAt: swipe.createdAt,
        message: swipe.message || null, // Message attached to the like
      };
    });

    return NextResponse.json({ users: formattedLikes });
  } catch (error) {
    console.error("Error fetching likes you:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

