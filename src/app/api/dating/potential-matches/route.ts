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

// Geocode zip code to lat/lon using OpenStreetMap Nominatim API
async function geocodeZipCode(zipCode: string): Promise<{ lat: number; lon: number; city?: string } | null> {
  try {
    // Clean zip code (remove any spaces or non-numeric characters except dashes for US ZIP+4)
    const cleanZip = zipCode.trim().replace(/\s+/g, "");
    
    // Try US zip code format first (5 digits or 5+4)
    if (/^\d{5}(-\d{4})?$/.test(cleanZip)) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanZip)}&countrycodes=us&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'DecibelTribe/1.0'
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Geocoding API error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      if (data && data.length > 0) {
        // Extract city name from display_name (format: "City, State, Country" or "City, County, State, Country")
        const displayName = data[0].display_name || "";
        const parts = displayName.split(",");
        const city = parts[0]?.trim() || null;
        
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          city: city,
        };
      }
    }
    
    // Fallback: try as general location search
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(zipCode)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'DecibelTribe/1.0'
        }
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      // Extract city name from display_name
      const displayName = data[0].display_name || "";
      const parts = displayName.split(",");
      const city = parts[0]?.trim() || null;
      
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        city: city,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }
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
        { error: "Dating preferences not set. Please complete your dating profile setup." },
        { status: 400 }
      );
    }

    // Validate required preference fields
    if (!preferences.preferredMinAge || !preferences.preferredMaxAge) {
      return NextResponse.json(
        { error: "Age preferences not set. Please update your dating preferences." },
        { status: 400 }
      );
    }

    // Parse preferredGender - support both old format (single string) and new format (JSON array)
    let preferredGenders: Array<{ gender: string; sexualOrientation: string }> = [];
    try {
      if (preferences.preferredGender) {
        const parsed = JSON.parse(preferences.preferredGender);
        if (Array.isArray(parsed)) {
          preferredGenders = parsed.filter(p => p && p.gender); // Filter out invalid entries
        } else {
          // Old format: single gender with single orientation
          if (preferences.preferredGender) {
            preferredGenders = [{
              gender: preferences.preferredGender,
              sexualOrientation: preferences.preferredSexualOrientation || ""
            }];
          }
        }
      }
    } catch (parseError) {
      // Not JSON, use as single value (old format)
      if (preferences.preferredGender) {
        preferredGenders = [{
          gender: preferences.preferredGender,
          sexualOrientation: preferences.preferredSexualOrientation || ""
        }];
      }
    }

    // Validate that we have at least one gender preference
    if (preferredGenders.length === 0) {
      return NextResponse.json(
        { error: "No gender preferences set. Please update your dating preferences." },
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
    
    // Get current user's location coordinates
    if (!userLatitude || !userLongitude) {
      const currentUserProfile = await prisma.user_dating_profile.findUnique({
        where: { userId: user.id },
        select: { zipCode: true, city: true, latitude: true, longitude: true },
      });
      
      if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
        // Use cached coordinates
        userLatitude = currentUserProfile.latitude;
        userLongitude = currentUserProfile.longitude;
      } else if (currentUserProfile?.zipCode) {
        // Geocode the zip code and cache coordinates + city
        const geocoded = await geocodeZipCode(currentUserProfile.zipCode);
        if (geocoded) {
          userLatitude = geocoded.lat;
          userLongitude = geocoded.lon;
          
          // Cache the coordinates and city in the profile
          await prisma.user_dating_profile.update({
            where: { userId: user.id },
            data: {
              latitude: geocoded.lat,
              longitude: geocoded.lon,
              city: geocoded.city || null,
            },
          });
        }
      }
    }

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
          // Match gender preference - check if their gender matches any of our preferred genders
          ...(preferredGenders.length > 0 && preferredGenders.some(p => p.gender) ? {
            gender: { in: preferredGenders.map(p => p.gender).filter(Boolean) }
          } : {}),
          // Match age range (only if both min and max are set)
          ...(preferences.preferredMinAge && preferences.preferredMaxAge ? {
            age: {
              gte: preferences.preferredMinAge,
              lte: preferences.preferredMaxAge,
            },
          } : {}),
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
          // Match hasKids preference if specified
          ...(preferences.preferredHasKids && preferences.preferredHasKids !== "any"
            ? {
                hasKids: preferences.preferredHasKids === "yes",
              }
            : {}),
          // Match smokes preference if specified
          ...(preferences.preferredSmokes
            ? {
                smokes: preferences.preferredSmokes,
              }
            : {}),
          // Match drinks preference if specified
          ...(preferences.preferredDrinks
            ? {
                drinks: preferences.preferredDrinks,
              }
            : {}),
          // Match activity preference if specified
          ...(preferences.preferredActivity
            ? {
                activity: preferences.preferredActivity,
              }
            : {}),
        },
        // Reciprocal preference check: they must also prefer the current user
        // This is handled in post-processing since we need to parse their preferredGender JSON
        user_dating_preferences: {
          ...(profile.age ? {
            preferredMinAge: { lte: profile.age },
            preferredMaxAge: { gte: profile.age },
          } : {}),
        },
        // Music filter: use preferences
        ...((preferences.preferredInstruments || []).length > 0
          ? {
              userInstruments: {
                some: {
                  instrument: {
                    name: {
                      in: preferences.preferredInstruments || [],
                    },
                  },
                },
              },
            }
          : {}),
        ...((preferences.preferredSkills || []).length > 0
          ? {
              userSkills: {
                some: {
                  skill: {
                    name: {
                      in: preferences.preferredSkills || [],
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        user_dating_profile: true,
        user_dating_preferences: true,
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

    // Filter matches by reciprocal preferences (they must also want us)
    const reciprocalMatches = matches.filter((match) => {
      if (!match.user_dating_preferences) return false;
      
      // Parse their preferredGender (support both formats)
      let theirPreferredGenders: Array<{ gender: string; sexualOrientation: string }> = [];
      try {
        if (match.user_dating_preferences.preferredGender) {
          const parsed = JSON.parse(match.user_dating_preferences.preferredGender);
          if (Array.isArray(parsed)) {
            theirPreferredGenders = parsed;
          } else {
            // Old format
            theirPreferredGenders = [{
              gender: match.user_dating_preferences.preferredGender,
              sexualOrientation: match.user_dating_preferences.preferredSexualOrientation || ""
            }];
          }
        }
      } catch {
        // Not JSON, use as single value
        if (match.user_dating_preferences.preferredGender) {
          theirPreferredGenders = [{
            gender: match.user_dating_preferences.preferredGender,
            sexualOrientation: match.user_dating_preferences.preferredSexualOrientation || ""
          }];
        }
      }
      
      // Check if they want our gender with matching orientation
      const ourGender = profile.gender;
      const ourOrientation = profile.sexualOrientation;
      
      if (!ourGender || !ourOrientation) {
        console.log(`[Potential Matches] Filtering out match ${match.id}: Missing our gender or orientation (gender: ${ourGender}, orientation: ${ourOrientation})`);
        return false;
      }
      
      const matches = theirPreferredGenders.some(pref => {
        const genderMatch = pref.gender?.toLowerCase() === ourGender.toLowerCase();
        const orientationMatch = pref.sexualOrientation?.toLowerCase() === ourOrientation.toLowerCase();
        return genderMatch && orientationMatch;
      });
      
      if (!matches) {
        console.log(`[Potential Matches] Filtering out match ${match.id}: No reciprocal preference match. Our: ${ourGender}/${ourOrientation}, Their preferences:`, theirPreferredGenders);
      }
      
      return matches;
    });

    // Format response with compatibility scores
    const formattedMatches = await Promise.all(
      reciprocalMatches.map(async (match) => {
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
          location: match.user_dating_profile?.zipCode || null,
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
        
        // Calculate distance if we have coordinates for both users
        // Use cached city name from profile
        let distance: number | null = null;
        const cityName: string | null = match.user_dating_profile?.city || null;
        
        if (userLatitude && userLongitude && match.user_dating_profile?.latitude && match.user_dating_profile?.longitude) {
          const matchLatitude = match.user_dating_profile.latitude;
          const matchLongitude = match.user_dating_profile.longitude;
          distance = calculateDistance(userLatitude, userLongitude, matchLatitude, matchLongitude);
        }
        
        const distanceScore = calculateDistanceScore(
          distance,
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
          height: match.user_dating_profile?.height || null,
          gender: match.user_dating_profile?.gender || null,
          bio: match.user_dating_profile?.bio || match.bio || "",
          hasKids: match.user_dating_profile?.hasKids ?? null,
          smokes: match.user_dating_profile?.smokes || null,
          drinks: match.user_dating_profile?.drinks || null,
          activity: match.user_dating_profile?.activity || null,
          college: match.user_dating_profile?.college || null,
          job: match.user_dating_profile?.job || null,
          pets: match.user_dating_profile?.pets || null,
          interests: match.user_dating_profile?.interests || [],
          photos: match.user_photos.map((p) => ({
            url: p.url,
            isPrimary: p.isPrimary,
          })),
          primaryPhotoUrl: primaryPhoto?.url || match.avatarUrl,
          distance: distance,
          location: cityName || match.user_dating_profile?.zipCode || null,
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
    const errorMessage = error instanceof Error 
      ? `${error.message}${error.stack ? `\n${error.stack}` : ''}` 
      : "Internal server error";
    console.error("Full error details:", errorMessage);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

