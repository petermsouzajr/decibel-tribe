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
      select: { isDatingActive: true, userDatingProfile: true },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const takeParam = searchParams.get("take");
    const takeLimit = takeParam ? parseInt(takeParam, 10) : 5;

    // Get swipe history
    const swipes = await prisma.swipe.findMany({
      where: { fromUserId: user.id },
      include: {
        toUser: {
          include: {
            userDatingProfile: true,
            userDatingPhotos: {
              orderBy: { isPrimary: "desc" },
            },
            userInstruments: {
              include: { instrument: true },
            },
            userSkills: {
              include: { skill: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: takeLimit,
    });

    if (!swipes.length) {
      return NextResponse.json({ profiles: [] });
    }

    // Check if matched
    const matchedUserIds = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    }).then((matches) =>
      matches.map((m) => (m.user1Id === user.id ? m.user2Id : m.user1Id))
    );

    // Format response similar to potential-matches
    const formattedProfiles = swipes.map((swipe) => {
      const targetUser = swipe.toUser;
      
      // Calculate distance if both users have location data
      let distance: number | null = null;
      if (
        currentUser.userDatingProfile?.latitude &&
        currentUser.userDatingProfile?.longitude &&
        targetUser.userDatingProfile?.latitude &&
        targetUser.userDatingProfile?.longitude
      ) {
        const R = 6371; // Earth's radius in km
        const dLat =
          ((targetUser.userDatingProfile.latitude -
            currentUser.userDatingProfile.latitude) *
            Math.PI) /
          180;
        const dLon =
          ((targetUser.userDatingProfile.longitude -
            currentUser.userDatingProfile.longitude) *
            Math.PI) /
          180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(
            (currentUser.userDatingProfile.latitude * Math.PI) / 180
          ) *
            Math.cos(
              (targetUser.userDatingProfile.latitude * Math.PI) / 180
            ) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      const isMatched = matchedUserIds.includes(targetUser.id);

      // Handle users lacking partial profile
      const prof = targetUser.userDatingProfile || {} as any;

      return {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName || targetUser.username,
        age: prof.age || null,
        height: prof.height || null,
        gender: prof.gender || null,
        sexualOrientation: prof.sexualOrientation || null,
        coronavirusVaccinated: prof.coronavirusVaccinated || null,
        religion: prof.religion || null,
        bio: prof.bio || "",
        hasKids: prof.hasKids !== undefined ? prof.hasKids : null,
        smokes: prof.smokes || null,
        drinks: prof.drinks || null,
        activity: prof.activity || null,
        education: prof.education || null,
        job: prof.job || null,
        pets: prof.pets || [],
        interests: prof.interests || [],
        photos: (targetUser.userDatingPhotos || []).map((p: any) => ({
          url: p.url,
          isPrimary: p.isPrimary,
        })),
        primaryPhotoUrl:
          (targetUser.userDatingPhotos || []).find((p: any) => p.isPrimary)?.url ||
          (targetUser.userDatingPhotos || [])[0]?.url ||
          targetUser.avatarUrl ||
          null,
        distance,
        location: prof.city || prof.zipCode || null,
        isIDVerified: false, // In a real app, query userDatingIdentityVerification
        musicInfo: {
          instruments: (targetUser.userInstruments || []).map((ui: any) => ui.instrument.name),
          skills: (targetUser.userSkills || []).map((us: any) => us.skill.name),
        },
        currentSwipe: {
          id: swipe.id,
          direction: swipe.direction,
          canUnlike: swipe.direction === "LIKE" && !isMatched,
        },
      };
    });

    // We must reverse them so the oldest historical card is at element 0,
    // and the most recent historical card is at the end.
    // That way, prepending them to the queue puts the most recent card exactly at `index - 1`.
    return NextResponse.json({ profiles: formattedProfiles.reverse() });
  } catch (error) {
    console.error("Error fetching history profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
