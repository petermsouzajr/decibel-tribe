import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { userId } = params;

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

    // Get the target user's profile
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userDatingProfile: true,
        userDatingPhotos: {
          orderBy: { isPrimary: "desc" },
        },
        userInstruments: {
          include: {
            instrument: true,
          },
        },
        userSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!targetUser || !targetUser.userDatingProfile) {
      return NextResponse.json(
        { error: "User not found or profile not available" },
        { status: 404 }
      );
    }

    // Check if user has already swiped on this person
    const existingSwipe = await prisma.swipe.findFirst({
      where: {
        fromUserId: user.id,
        toUserId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if matched
    const isMatched = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: userId },
          { user1Id: userId, user2Id: user.id },
        ],
      },
    });

    // Calculate distance if both users have location data
    let distance: number | null = null;
    if (
      currentUser.userDatingProfile?.latitude &&
      currentUser.userDatingProfile?.longitude &&
      targetUser.userDatingProfile.latitude &&
      targetUser.userDatingProfile.longitude
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

    // Format response similar to potential-matches
    const formattedProfile = {
      id: targetUser.id,
      username: targetUser.username,
      displayName: targetUser.displayName || targetUser.username,
      age: targetUser.userDatingProfile.age,
      height: targetUser.userDatingProfile.height,
      gender: targetUser.userDatingProfile.gender,
      sexualOrientation: targetUser.userDatingProfile.sexualOrientation,
      coronavirusVaccinated: targetUser.userDatingProfile.coronavirusVaccinated,
      religion: targetUser.userDatingProfile.religion,
      bio: targetUser.userDatingProfile.bio || "",
      hasKids: targetUser.userDatingProfile.hasKids,
      smokes: targetUser.userDatingProfile.smokes,
      drinks: targetUser.userDatingProfile.drinks,
      activity: targetUser.userDatingProfile.activity,
      education: targetUser.userDatingProfile.education,
      job: targetUser.userDatingProfile.job,
      pets: targetUser.userDatingProfile.pets,
      interests: targetUser.userDatingProfile.interests || [],
      photos: targetUser.userDatingPhotos.map((p: { url: string; isPrimary: boolean }) => ({
        url: p.url,
        isPrimary: p.isPrimary,
      })),
      primaryPhotoUrl:
        targetUser.userDatingPhotos.find((p: { isPrimary: boolean }) => p.isPrimary)?.url ||
        targetUser.avatarUrl ||
        null,
      distance,
      location:
        targetUser.userDatingProfile.city ||
        targetUser.userDatingProfile.zipCode ||
        null,
      musicInfo: {
        instruments: targetUser.userInstruments.map((ui) => ui.instrument.name),
        skills: targetUser.userSkills.map((us) => us.skill.name),
      },
      currentSwipe: existingSwipe
        ? {
            id: existingSwipe.id,
            direction: existingSwipe.direction,
            canUnlike:
              existingSwipe.direction === "LIKE" &&
              !isMatched, // Can unlike any unmatched like at any time
          }
        : null,
    };

    return NextResponse.json({ profile: formattedProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

