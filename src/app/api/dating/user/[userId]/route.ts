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
      select: { isDatingActive: true, user_dating_profile: true },
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
        user_dating_profile: true,
        user_photos: {
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

    if (!targetUser || !targetUser.user_dating_profile) {
      return NextResponse.json(
        { error: "User not found or profile not available" },
        { status: 404 }
      );
    }

    // Check if user has already swiped on this person
    const existingSwipe = await prisma.swipes.findFirst({
      where: {
        fromUserId: user.id,
        toUserId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if matched
    const isMatched = await prisma.matches.findFirst({
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
      currentUser.user_dating_profile?.latitude &&
      currentUser.user_dating_profile?.longitude &&
      targetUser.user_dating_profile.latitude &&
      targetUser.user_dating_profile.longitude
    ) {
      const R = 6371; // Earth's radius in km
      const dLat =
        ((targetUser.user_dating_profile.latitude -
          currentUser.user_dating_profile.latitude) *
          Math.PI) /
        180;
      const dLon =
        ((targetUser.user_dating_profile.longitude -
          currentUser.user_dating_profile.longitude) *
          Math.PI) /
        180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(
          (currentUser.user_dating_profile.latitude * Math.PI) / 180
        ) *
          Math.cos(
            (targetUser.user_dating_profile.latitude * Math.PI) / 180
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
      age: targetUser.user_dating_profile.age,
      height: targetUser.user_dating_profile.height,
      gender: targetUser.user_dating_profile.gender,
      sexualOrientation: targetUser.user_dating_profile.sexualOrientation,
      coronavirusVaccinated: targetUser.user_dating_profile.coronavirusVaccinated,
      religion: targetUser.user_dating_profile.religion,
      bio: targetUser.user_dating_profile.bio || "",
      hasKids: targetUser.user_dating_profile.hasKids,
      smokes: targetUser.user_dating_profile.smokes,
      drinks: targetUser.user_dating_profile.drinks,
      activity: targetUser.user_dating_profile.activity,
      education: targetUser.user_dating_profile.education,
      job: targetUser.user_dating_profile.job,
      pets: targetUser.user_dating_profile.pets,
      interests: targetUser.user_dating_profile.interests || [],
      photos: targetUser.user_photos.map((p) => ({
        url: p.url,
        isPrimary: p.isPrimary,
      })),
      primaryPhotoUrl:
        targetUser.user_photos.find((p) => p.isPrimary)?.url ||
        targetUser.avatarUrl ||
        null,
      distance,
      location:
        targetUser.user_dating_profile.city ||
        targetUser.user_dating_profile.zipCode ||
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

