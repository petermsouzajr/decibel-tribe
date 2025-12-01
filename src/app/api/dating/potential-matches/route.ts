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

// Haversine formula to calculate distance between two lat/lon points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple geocoding - convert zipcode to approximate lat/lon
// In production, use a proper geocoding service (Google Maps, OpenStreetMap, etc.)
async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  // For now, return null - we'll need to implement proper geocoding
  // This is a placeholder - you should integrate with a geocoding API
  // For MVP, we can match by location string or require lat/lon in profile
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has dating active (non-verified users can browse but won't appear in decks)
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

    // Get user's dating preferences
    const preferences = await prisma.user_dating_preferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      return NextResponse.json(
        { error: "Dating preferences not set" },
        { status: 400 }
      );
    }

    // Get user's dating profile
    const profile = await prisma.user_dating_profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Dating profile not complete" },
        { status: 400 }
      );
    }

    // Check for active location override (travel mode)
    const locationOverride = await prisma.dating_location_overrides.findUnique({
      where: { userId: user.id },
    });

    // Use override location if active and not expired, otherwise use profile location
    let userLatitude: number | null = null;
    let userLongitude: number | null = null;
    
    if (locationOverride && locationOverride.expiresAt > new Date()) {
      // Travel mode is active
      userLatitude = locationOverride.latitude;
      userLongitude = locationOverride.longitude;
    } else if (locationOverride && locationOverride.expiresAt <= new Date()) {
      // Clean up expired override
      await prisma.dating_location_overrides.delete({
        where: { id: locationOverride.id },
      });
    }
    // Note: For now, we don't have lat/lon in profile, so we'll skip distance calculation
    // In production, you'd geocode the location string or store lat/lon

    // Get cursor for pagination
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get users the current user has already swiped on
    const swipedUserIds = await prisma.swipes.findMany({
      where: { fromUserId: user.id },
      select: { toUserId: true },
    });
    const swipedIds = swipedUserIds.map((s) => s.toUserId);

    // Get users the current user has already matched with
    const matchedUserIds = await prisma.matches.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
      select: { user1Id: true, user2Id: true },
    });
    const matchedIds = matchedUserIds
      .map((m) => (m.user1Id === user.id ? m.user2Id : m.user1Id))
      .filter(Boolean);

    // Get users the current user has blocked
    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: user.id },
      select: { blockedId: true },
    });
    const blockedIds = blockedUsers.map((b) => b.blockedId);

    // Get users who have blocked the current user
    const blockedByUsers = await prisma.block.findMany({
      where: { blockedId: user.id },
      select: { blockerId: true },
    });
    const blockedByIds = blockedByUsers.map((b) => b.blockerId);

    // Build query conditions - exclude blocked users and users who blocked you
    const excludeIds = [user.id, ...swipedIds, ...matchedIds, ...blockedIds, ...blockedByIds];

    // Find potential matches
    // Note: This is a simplified version. In production, you'd want:
    // - Proper geocoding for location
    // - More sophisticated filtering
    // - Better indexing
    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        deletedAt: null,
        isVerified: true, // Only show verified users in decks (non-verified users can browse but won't appear)
        isDatingActive: true,
        user_dating_profile: {
          // Match gender preference
          gender: preferences.preferredGender || undefined,
          // Match age range
          age: {
            gte: preferences.preferredMinAge,
            lte: preferences.preferredMaxAge,
          },
          // Match height range if specified
          ...(preferences.preferredMinHeight && preferences.preferredMaxHeight
            ? {
                height: {
                  gte: preferences.preferredMinHeight,
                  lte: preferences.preferredMaxHeight,
                },
              }
            : {}),
          // Match vaccination preference if specified
          ...(preferences.preferredCoronavirusVaccinated
            ? {
                coronavirusVaccinated: preferences.preferredCoronavirusVaccinated,
              }
            : {}),
          // Match religion if specified
          ...(preferences.preferredReligions.length > 0
            ? {
                religion: { in: preferences.preferredReligions },
              }
            : {}),
        },
        // Reciprocal preference check: they must also prefer the current user
        user_dating_preferences: {
          preferredGender: profile.gender || undefined,
          preferredSexualOrientation: profile.sexualOrientation || undefined,
          preferredMinAge: { lte: profile.age || 100 },
          preferredMaxAge: { gte: profile.age || 18 },
        },
        // Music filter: use URL params if provided, otherwise use preferences
        ...((preferredInstruments.length > 0
          ? preferredInstruments
          : preferences.preferredInstruments || []).length > 0
          ? {
              userInstruments: {
                some: {
                  instrument: {
                    name: {
                      in:
                        preferredInstruments.length > 0
                          ? preferredInstruments
                          : preferences.preferredInstruments || [],
                    },
                  },
                },
              },
            }
          : {}),
        ...((preferredSkills.length > 0
          ? preferredSkills
          : preferences.preferredSkills || []).length > 0
          ? {
              userSkills: {
                some: {
                  skill: {
                    name: {
                      in:
                        preferredSkills.length > 0
                          ? preferredSkills
                          : preferences.preferredSkills || [],
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        user_dating_profile: true,
        user_photos: {
          where: { isPrimary: true },
          take: 1,
        },
        userInstruments: {
          include: { instrument: true },
        },
        userSkills: {
          include: { skill: true },
        },
      },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" }, // Simple ordering for now
    });

    const hasNextPage = potentialMatches.length > limit;
    const matches = hasNextPage ? potentialMatches.slice(0, limit) : potentialMatches;
    const nextCursor = hasNextPage ? matches[matches.length - 1].id : null;

    // Get current user's music data for compatibility calculation
    const currentUserMusic = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userInstruments: { include: { instrument: true } },
        userSkills: { include: { skill: true } },
        _count: { select: { posts: true } },
      },
    });

    const currentUserInstruments =
      currentUserMusic?.userInstruments.map((ui) => ui.instrument.name) || [];
    const currentUserSkills =
      currentUserMusic?.userSkills.map((us) => us.skill.name) || [];

    // Format response with compatibility scores
    const formattedMatches = await Promise.all(
      matches.map(async (match) => {
        const primaryPhoto = match.user_photos[0];
        const instruments = match.userInstruments.map((ui) => ui.instrument.name);
        const skills = match.userSkills.map((us) => us.skill.name);

        // Calculate compatibility scores
        const musicScore = calculateMusicCompatibility(
          currentUserInstruments,
          currentUserSkills,
          instruments,
          skills,
        );

        const profileCompleteness = calculateProfileCompleteness({
          bio: match.bio,
          age: match.user_dating_profile?.age || null,
          height: match.user_dating_profile?.height || null,
          gender: match.user_dating_profile?.gender || null,
          location: match.user_dating_profile?.location || null,
          photos: match.user_photos.length,
        });

        // Get match's post count for activity level
        const matchPostCount = await prisma.post.count({
          where: {
            userId: match.id,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        });

        const activityLevel = calculateActivityLevel(matchPostCount);
        const distanceScore = calculateDistanceScore(
          null, // Distance not available yet
          preferences.preferredMaxDistanceKm,
        );

        // Check mutual connections (followers in common)
        const mutualConnections = await prisma.follow.count({
          where: {
            followerId: { in: [user.id, match.id] },
            followingId: { in: [user.id, match.id] },
          },
        });

        const overallCompatibility = calculateOverallCompatibility(
          musicScore,
          profileCompleteness,
          activityLevel,
          distanceScore,
          mutualConnections,
          preferences.matchMusicTastes ?? true,
        );

        return {
          id: match.id,
          username: match.username,
          displayName: match.displayName,
          age: match.user_dating_profile?.age || null,
          bio: match.bio || "",
          photos: match.user_photos.map((p) => ({
            url: p.url,
            isPrimary: p.isPrimary,
          })),
          primaryPhotoUrl: primaryPhoto?.url || match.avatarUrl,
          distance: null, // Will be calculated once we have geocoding
          location: match.user_dating_profile?.location || null,
          musicInfo: {
            instruments,
            skills,
          },
          compatibility: {
            overall: overallCompatibility,
            music: musicScore,
            profile: profileCompleteness,
            activity: activityLevel,
          },
        };
      })
    );

    // Sort by compatibility score if music matching is enabled
    if (preferences.matchMusicTastes ?? true) {
      formattedMatches.sort((a, b) => b.compatibility.overall - a.compatibility.overall);
    }

    return NextResponse.json({
      matches: formattedMatches,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching potential matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

