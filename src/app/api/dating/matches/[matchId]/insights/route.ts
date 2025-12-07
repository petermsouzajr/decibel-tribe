import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  calculateMusicCompatibility,
  calculateOverallCompatibility,
  calculateProfileCompleteness,
  calculateActivityLevel,
  calculateDistanceScore,
} from "@/lib/dating/compatibility";

export async function GET(request: NextRequest, props: { params: Promise<{ matchId: string }> }) {
  const params = await props.params;
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = params;

    // Verify user is part of this match
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.user1Id !== user.id && match.user2Id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this match" },
        { status: 403 }
      );
    }

    const otherUserId = match.user1Id === user.id ? match.user2Id : match.user1Id;

    // Get both users' data
    const [currentUser, otherUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        include: {
          user_dating_profile: true,
          userInstruments: { include: { instrument: true } },
          userSkills: { include: { skill: true } },
          _count: { select: { posts: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: otherUserId },
        include: {
          user_dating_profile: true,
          userInstruments: { include: { instrument: true } },
          userSkills: { include: { skill: true } },
          _count: { select: { posts: true } },
        },
      }),
    ]);

    if (!currentUser || !otherUser) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 404 }
      );
    }

    // Get preferences
    const preferences = await prisma.user_dating_preferences.findUnique({
      where: { userId: user.id },
    });

    // Calculate compatibility scores
    const currentUserInstruments = currentUser.userInstruments.map(
      (ui) => ui.instrument.name
    );
    const currentUserSkills = currentUser.userSkills.map((us) => us.skill.name);
    const otherUserInstruments = otherUser.userInstruments.map(
      (ui) => ui.instrument.name
    );
    const otherUserSkills = otherUser.userSkills.map((us) => us.skill.name);

    const musicScore = calculateMusicCompatibility(
      currentUserInstruments,
      currentUserSkills,
      otherUserInstruments,
      otherUserSkills,
    );

    const currentUserProfileCompleteness = calculateProfileCompleteness({
      bio: currentUser.bio,
      age: currentUser.user_dating_profile?.age || null,
      height: currentUser.user_dating_profile?.height || null,
      gender: currentUser.user_dating_profile?.gender || null,
      location: currentUser.user_dating_profile?.city || currentUser.user_dating_profile?.zipCode || null,
      photos: 0, // We'd need to fetch photos separately
    });

    const otherUserProfileCompleteness = calculateProfileCompleteness({
      bio: otherUser.bio,
      age: otherUser.user_dating_profile?.age || null,
      height: otherUser.user_dating_profile?.height || null,
      gender: otherUser.user_dating_profile?.gender || null,
      location: otherUser.user_dating_profile?.city || otherUser.user_dating_profile?.zipCode || null,
      photos: 0,
    });

    const currentUserActivity = calculateActivityLevel(
      currentUser._count.posts
    );
    const otherUserActivity = calculateActivityLevel(otherUser._count.posts);

    // Find common interests
    const commonInstruments = currentUserInstruments.filter((inst) =>
      otherUserInstruments.includes(inst)
    );
    const commonSkills = currentUserSkills.filter((skill) =>
      otherUserSkills.includes(skill)
    );

    // Get mutual connections
    const mutualConnections = await prisma.follow.count({
      where: {
        followerId: { in: [user.id, otherUserId] },
        followingId: { in: [user.id, otherUserId] },
      },
    });

    const overallCompatibility = calculateOverallCompatibility(
      musicScore,
      (currentUserProfileCompleteness + otherUserProfileCompleteness) / 2,
      (currentUserActivity + otherUserActivity) / 2,
      50, // Distance score placeholder
      mutualConnections,
      preferences?.matchMusicTastes ?? true,
    );

    // Generate conversation starters based on common interests
    const conversationStarters: string[] = [];
    if (commonInstruments.length > 0) {
      conversationStarters.push(
        `You both play ${commonInstruments[0]}! Talk about your favorite songs or jamming together.`
      );
    }
    if (commonSkills.length > 0) {
      conversationStarters.push(
        `You both have experience with ${commonSkills[0]}. Share your experiences!`
      );
    }
    if (commonInstruments.length === 0 && commonSkills.length === 0) {
      conversationStarters.push(
        "Ask about their music taste and what they're currently listening to!"
      );
      conversationStarters.push(
        "Share your favorite music genres or recent concerts you've been to."
      );
    }

    return NextResponse.json({
      compatibility: {
        overall: overallCompatibility,
        music: musicScore,
        profile: (currentUserProfileCompleteness + otherUserProfileCompleteness) / 2,
        activity: (currentUserActivity + otherUserActivity) / 2,
      },
      commonInterests: {
        instruments: commonInstruments,
        skills: commonSkills,
        total: commonInstruments.length + commonSkills.length,
      },
      musicOverlap: {
        yourInstruments: currentUserInstruments,
        theirInstruments: otherUserInstruments,
        yourSkills: currentUserSkills,
        theirSkills: otherUserSkills,
        commonInstruments,
        commonSkills,
      },
      conversationStarters,
    });
  } catch (error) {
    console.error("Error fetching match insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}









