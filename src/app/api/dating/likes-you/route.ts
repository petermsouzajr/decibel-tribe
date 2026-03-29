import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type IdVerificationFilter = "show_id_verified_only" | "show_all" | "show_unverified_only";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if dating is active
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        isEmailVerified: true,
        isDatingActive: true,
        userDatingPreferences: {
          select: { idVerificationFilter: true },
        },
      },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    // Resolve filter: ?filter= query param overrides saved preference
    const queryFilter = request.nextUrl.searchParams.get("filter") as IdVerificationFilter | null;
    const savedFilter = (currentUser.userDatingPreferences?.idVerificationFilter ?? "show_id_verified_only") as IdVerificationFilter;
    const activeFilter: IdVerificationFilter = queryFilter ?? savedFilter;

    // Build the ID verification where clause for the fromUser relation
    let fromUserVerificationWhere: object = {};
    if (activeFilter === "show_id_verified_only") {
      fromUserVerificationWhere = {
        userDatingIdentityVerification: { isIDVerified: true },
      };
    } else if (activeFilter === "show_unverified_only") {
      fromUserVerificationWhere = {
        OR: [
          { userDatingIdentityVerification: null },
          { userDatingIdentityVerification: { isIDVerified: false } },
        ],
      };
    }
    // "show_all" → no extra filter

    // Get all users who have matched with current user
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    });
    const matchedUserIds = existingMatches.map((m) =>
      m.user1Id === user.id ? m.user2Id : m.user1Id
    );

    // Get all users who have liked the current user (but haven't been matched yet),
    // filtered by the viewer's ID verification preference.
    // NOTE: Likes are ALWAYS recorded in the DB — only display is filtered here.
    const likesReceived = await prisma.swipe.findMany({
      where: {
        toUserId: user.id,
        direction: "LIKE",
        // Exclude already-matched users
        fromUserId: { notIn: matchedUserIds },
        // Apply ID verification filter on the liker
        fromUser: {
          isEmailVerified: true, // likers must at minimum be email-verified
          ...fromUserVerificationWhere,
        },
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            userDatingProfile: {
              select: {
                age: true,
                height: true,
                gender: true,
                city: true,
                zipCode: true,
              },
            },
            userDatingPhotos: {
              where: { isPrimary: true },
              take: 1,
            },
            userDatingIdentityVerification: {
              select: { isIDVerified: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format response — isIDVerified always included for badge display
    const formattedLikes = likesReceived.map((swipe) => {
      const liker = swipe.fromUser;
      return {
        id: liker.id,
        username: liker.username,
        displayName: liker.displayName,
        avatarUrl: liker.avatarUrl,
        primaryPhotoUrl: liker.userDatingPhotos[0]?.url || liker.avatarUrl,
        age: liker.userDatingProfile?.age || null,
        height: liker.userDatingProfile?.height || null,
        gender: liker.userDatingProfile?.gender || null,
        location: liker.userDatingProfile?.city || liker.userDatingProfile?.zipCode || null,
        likedAt: swipe.createdAt,
        message: swipe.message || null,
        isIDVerified: liker.userDatingIdentityVerification?.isIDVerified ?? false,
      };
    });

    return NextResponse.json({
      users: formattedLikes,
      activeFilter,
      savedFilter,
    });
  } catch (error) {
    console.error("Error fetching likes you:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
