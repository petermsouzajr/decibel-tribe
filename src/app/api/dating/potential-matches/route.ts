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

// Increase timeout for this route (default is 10s, increase to 60s)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

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
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      // Try US zip code format first (5 digits or 5+4)
      if (/^\d{5}(-\d{4})?$/.test(cleanZip)) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanZip)}&countrycodes=us&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'DecibelTribe/1.0'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
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
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error("Geocoding API timeout for zip code:", zipCode);
        return null;
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const isDev = process.env.NODE_ENV === "development";
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isDev) {
      console.log(`[Potential Matches] Request started for user ${user.id} at ${new Date().toISOString()}`);
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
    const prefStart = Date.now();
    const preferences = await prisma.userDatingPreferences.findUnique({
      where: { userId: user.id },
    });
    if (isDev) {
      console.log(`[Potential Matches] Got preferences in ${Date.now() - prefStart}ms`);
    }

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
    const profileStart = Date.now();
    const profile = await prisma.userDatingProfile.findUnique({
      where: { userId: user.id },
    });
    if (isDev) {
      console.log(`[Potential Matches] Got profile in ${Date.now() - profileStart}ms`);
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Dating profile not complete" },
        { status: 400 }
      );
    }

    // Get current user's location coordinates from profile
    const locationStart = Date.now();
    let userLatitude: number | null = null;
    let userLongitude: number | null = null;
    
    const currentUserProfile = await prisma.userDatingProfile.findUnique({
      where: { userId: user.id },
      select: { zipCode: true, city: true, latitude: true, longitude: true },
    });
    
    if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
      // Use cached coordinates
      userLatitude = currentUserProfile.latitude;
      userLongitude = currentUserProfile.longitude;
      if (isDev) {
        console.log(`[Potential Matches] Using cached coordinates in ${Date.now() - locationStart}ms`);
      }
    } else if (currentUserProfile?.zipCode) {
      // Geocode the zip code and cache coordinates + city
      const geocodeStart = Date.now();
      const geocoded = await geocodeZipCode(currentUserProfile.zipCode);
      if (isDev) {
        console.log(`[Potential Matches] Geocoding took ${Date.now() - geocodeStart}ms`);
      }
      if (geocoded) {
        userLatitude = geocoded.lat;
        userLongitude = geocoded.lon;
        
        // Cache the coordinates and city in the profile
        await prisma.userDatingProfile.update({
          where: { userId: user.id },
          data: {
            latitude: geocoded.lat,
            longitude: geocoded.lon,
            city: geocoded.city || null,
          },
        });
      }
    }
    if (isDev) {
      console.log(`[Potential Matches] Location processing completed in ${Date.now() - locationStart}ms`);
    }

    // Get cursor for pagination
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get users the current user has already swiped on
    const excludeStart = Date.now();
    const swipedUserIds = await prisma.swipe.findMany({
      where: { fromUserId: user.id },
      select: { toUserId: true },
    });
    const swipedIds = swipedUserIds.map((s) => s.toUserId);

    // Get users the current user has already matched with
    const matchedUserIds = await prisma.match.findMany({
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
    if (isDev) {
      console.log(`[Potential Matches] Got excluded users in ${Date.now() - excludeStart}ms (swiped: ${swipedIds.length}, matched: ${matchedIds.length}, blocked: ${blockedIds.length + blockedByIds.length})`);
    }

    // Build query conditions - exclude blocked users and users who blocked you
    const excludeIds = [user.id, ...swipedIds, ...matchedIds, ...blockedIds, ...blockedByIds];

    // Find potential matches
    // Note: This is a simplified version. In production, you'd want:
    // - Proper geocoding for location
    // - More sophisticated filtering
    // - Better indexing
    const queryStart = Date.now();
    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        deletedAt: null,
        isVerified: true, // Only show verified users in decks (non-verified users can browse but won't appear)
        isDatingActive: true,
        userDatingProfile: {
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
        userDatingPreferences: {
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
        userDatingProfile: true,
        userDatingPreferences: true,
        userDatingPhotos: {
          // Include all photos to check count requirement (at least 1 required)
          take: 5, // Max photos is 5
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
    if (isDev) {
      console.log(`[Potential Matches] Main query completed in ${Date.now() - queryStart}ms, found ${potentialMatches.length} potential matches`);
    }

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
    // Also filter by distance and photo requirements
    const reciprocalMatches = matches.filter((match) => {
      if (!match.userDatingPreferences) return false;
      
      // REQUIREMENT: Users must be verified AND have at least 1 dating photo
      // Note: isVerified is already filtered in DB query, but we check photos here as a safety measure
      // (in case a verified user deletes all photos, or if verification doesn't strictly enforce photos)
      if (!match.userDatingPhotos || match.userDatingPhotos.length === 0) {
        if (isDev) {
          console.log(`[Potential Matches] Filtering out match ${match.id}: No dating photos (verified users should have photos)`);
        }
        return false;
      }
      
      // REQUIREMENT: Filter by distance using SEARCHER's preference (unidirectional filter)
      // User A with 100 mile preference will see User B at 80 miles, even if User B has 10 mile preference
      // The filter is based on the searcher's preference, not mutual agreement
      if (
        userLatitude && 
        userLongitude && 
        match.userDatingProfile?.latitude && 
        match.userDatingProfile?.longitude &&
        preferences.preferredMaxDistanceKm
      ) {
        const matchLatitude = match.userDatingProfile.latitude;
        const matchLongitude = match.userDatingProfile.longitude;
        const distanceKm = calculateDistance(
          userLatitude, 
          userLongitude, 
          matchLatitude, 
          matchLongitude
        );
        
        // Filter out matches beyond the SEARCHER's max distance preference
        // This is unidirectional - uses current user's preference, not the match's preference
        if (distanceKm > preferences.preferredMaxDistanceKm) {
          if (isDev) {
            console.log(`[Potential Matches] Filtering out match ${match.id}: Distance ${distanceKm.toFixed(2)}km exceeds searcher's max ${preferences.preferredMaxDistanceKm}km`);
          }
          return false;
        }
      }
      
      // Parse their preferredGender (support both formats)
      let theirPreferredGenders: Array<{ gender: string; sexualOrientation: string }> = [];
      try {
        if (match.userDatingPreferences.preferredGender) {
          const parsed = JSON.parse(match.userDatingPreferences.preferredGender);
          if (Array.isArray(parsed)) {
            theirPreferredGenders = parsed;
          } else {
            // Old format
            theirPreferredGenders = [{
              gender: match.userDatingPreferences.preferredGender,
              sexualOrientation: match.userDatingPreferences.preferredSexualOrientation || ""
            }];
          }
        }
      } catch {
        // Not JSON, use as single value
        if (match.userDatingPreferences.preferredGender) {
          theirPreferredGenders = [{
            gender: match.userDatingPreferences.preferredGender,
            sexualOrientation: match.userDatingPreferences.preferredSexualOrientation || ""
          }];
        }
      }
      
      // Check if they want our gender with matching orientation
      const ourGender = profile.gender;
      const ourOrientation = profile.sexualOrientation;
      
      if (!ourGender || !ourOrientation) {
        if (isDev) {
          console.log(`[Potential Matches] Filtering out match ${match.id}: Missing our gender or orientation (gender: ${ourGender}, orientation: ${ourOrientation})`);
        }
        return false;
      }
      
      const matches = theirPreferredGenders.some(pref => {
        const genderMatch = pref.gender?.toLowerCase() === ourGender.toLowerCase();
        const orientationMatch = pref.sexualOrientation?.toLowerCase() === ourOrientation.toLowerCase();
        return genderMatch && orientationMatch;
      });
      
      if (!matches && isDev) {
        console.log(`[Potential Matches] Filtering out match ${match.id}: No reciprocal preference match. Our: ${ourGender}/${ourOrientation}, Their preferences:`, theirPreferredGenders);
      }
      
      return matches;
    });
    if (isDev) {
      console.log(`[Potential Matches] Filtered to ${reciprocalMatches.length} reciprocal matches`);
    }

    // Early return if no matches after filtering
    if (reciprocalMatches.length === 0) {
      return NextResponse.json({
        matches: [],
        nextCursor: null,
      });
    }

    // Batch fetch post counts for all matches to reduce database queries
    const formatStart = Date.now();
    const matchIds = reciprocalMatches.map(m => m.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get post counts for all matches in one query
    const postCountStart = Date.now();
    const postCounts = await prisma.post.groupBy({
      by: ['userId'],
      where: {
        userId: { in: matchIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });
    if (isDev) {
      console.log(`[Potential Matches] Post counts query took ${Date.now() - postCountStart}ms`);
    }
    
    const postCountMap = new Map(
      postCounts.map(pc => [pc.userId, pc._count.id])
    );

    // Format response with compatibility scores
    const formattedMatches = await Promise.all(
      reciprocalMatches.map(async (match) => {
        // Find primary photo (or use first photo if no primary set)
        const primaryPhoto = match.userDatingPhotos.find((p: { isPrimary: boolean }) => p.isPrimary) || match.userDatingPhotos[0];
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
          age: match.userDatingProfile?.age || null,
          height: match.userDatingProfile?.height || null,
          gender: match.userDatingProfile?.gender || null,
          location: match.userDatingProfile?.zipCode || null,
          photos: match.userDatingPhotos.length,
        });

        // Get match's post count from batched query
        const matchPostCount = postCountMap.get(match.id) || 0;

        const activityLevel = calculateActivityLevel(matchPostCount);
        
        // Calculate distance if we have coordinates for both users
        // Use cached city name from profile
        let distance: number | null = null;
        const cityName: string | null = match.userDatingProfile?.city || null;
        
        if (userLatitude && userLongitude && match.userDatingProfile?.latitude && match.userDatingProfile?.longitude) {
          const matchLatitude = match.userDatingProfile.latitude;
          const matchLongitude = match.userDatingProfile.longitude;
          distance = calculateDistance(userLatitude, userLongitude, matchLatitude, matchLongitude);
        }
        
        const distanceScore = calculateDistanceScore(
          distance,
          preferences.preferredMaxDistanceKm,
        );

        // Check mutual connections (followers in common)
        // Note: This query is optimized to check both directions in one query
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
          age: match.userDatingProfile?.age || null,
          height: match.userDatingProfile?.height || null,
          gender: match.userDatingProfile?.gender || null,
          sexualOrientation: match.userDatingProfile?.sexualOrientation || null,
          coronavirusVaccinated: match.userDatingProfile?.coronavirusVaccinated || null,
          religion: match.userDatingProfile?.religion || null,
          bio: match.userDatingProfile?.bio || match.bio || "",
          hasKids: match.userDatingProfile?.hasKids ?? null,
          smokes: match.userDatingProfile?.smokes || null,
          drinks: match.userDatingProfile?.drinks || null,
          activity: match.userDatingProfile?.activity || null,
          education: match.userDatingProfile?.education || null,
          job: match.userDatingProfile?.job || null,
          pets: match.userDatingProfile?.pets || null,
          interests: match.userDatingProfile?.interests || [],
          photos: match.userDatingPhotos.map((p) => ({
            url: p.url,
            isPrimary: p.isPrimary,
          })),
          primaryPhotoUrl: primaryPhoto?.url || match.avatarUrl,
          distance: distance,
          location: cityName || match.userDatingProfile?.zipCode || null,
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
    if (isDev) {
      console.log(`[Potential Matches] Formatting matches took ${Date.now() - formatStart}ms`);
    }

    // Sort by compatibility score if music matching is enabled
    if (preferences.matchMusicTastes ?? true) {
      formattedMatches.sort((a, b) => b.compatibility.overall - a.compatibility.overall);
    }

    const totalTime = Date.now() - startTime;
    if (isDev) {
      console.log(`[Potential Matches] Request completed in ${totalTime}ms, returning ${formattedMatches.length} matches`);
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

