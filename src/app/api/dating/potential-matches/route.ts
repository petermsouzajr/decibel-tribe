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
    // New format: sexualOrientation is an array of strings
    let preferredGenders: Array<{ gender: string; sexualOrientation: string[] }> = [];
    try {
      if (preferences.preferredGender) {
        const parsed = JSON.parse(preferences.preferredGender);
        if (Array.isArray(parsed)) {
          // New format: array of gender preferences
          preferredGenders = parsed.filter(p => p && p.gender).map(p => ({
            gender: p.gender,
            sexualOrientation: Array.isArray(p.sexualOrientation) ? p.sexualOrientation : (p.sexualOrientation ? [p.sexualOrientation] : [])
          }));
        } else if (typeof parsed === 'string') {
          // JSON string containing a single gender string
          preferredGenders = [{
            gender: parsed,
            sexualOrientation: preferences.preferredSexualOrientation ? [preferences.preferredSexualOrientation] : []
          }];
        } else {
          // Parsed object but not an array (shouldn't happen, but handle gracefully)
          preferredGenders = [{
            gender: preferences.preferredGender,
            sexualOrientation: preferences.preferredSexualOrientation ? [preferences.preferredSexualOrientation] : []
          }];
        }
      }
    } catch (parseError) {
      // Not JSON, use as single value (old format)
      if (preferences.preferredGender) {
        preferredGenders = [{
          gender: preferences.preferredGender,
          sexualOrientation: preferences.preferredSexualOrientation ? [preferences.preferredSexualOrientation] : []
        }];
      }
    }

    // Validate that we have at least one gender preference with at least one orientation
    if (preferredGenders.length === 0 || !preferredGenders.some(p => p.sexualOrientation && p.sexualOrientation.length > 0)) {
      return NextResponse.json(
        { error: "No gender preferences set. Please update your dating preferences." },
        { status: 400 }
      );
    }

    // Get variability settings
    const variabilityLevel = preferences.variabilityLevel ?? 0;
    const variabilityFilters = preferences.variabilityFilters || [];
    const hasVariability = variabilityLevel > 0 && variabilityFilters.length > 0;

    // Helper function to apply variability to numeric ranges
    const applyVariabilityToRange = (min: number, max: number, filterKey: string): { min: number; max: number } => {
      if (!hasVariability || !variabilityFilters.includes(filterKey)) {
        return { min, max };
      }
      
      const range = max - min;
      const expansion = Math.round((range * variabilityLevel) / 100);
      return {
        min: Math.max(0, min - expansion), // Don't go below 0
        max: max + expansion,
      };
    };

    // Helper function to normalize values for comparison (handle UI vs DB format differences)
    const normalizeValue = (value: string | null | undefined): string | null => {
      if (!value) return null;
      return value.toLowerCase().trim();
    };

    // Normalize religion across legacy + UI variants
    const normalizeReligion = (value: string | null | undefined): string | null => {
      const v = normalizeValue(value);
      if (!v) return null;
      const mapping: Record<string, string> = {
        christian: "christianity",
        catholic: "catholicism",
        jewish: "judaism",
        muslim: "islam",
        atheist: "atheism",
        agnostic: "agnosticism",
      };
      return mapping[v] || v;
    };

    // Normalize yes/no values (e.g. "Yes" vs "yes")
    const normalizeYesNo = (value: string | null | undefined): "yes" | "no" | null => {
      const v = normalizeValue(value);
      if (!v) return null;
      if (v === "yes" || v === "y" || v === "true") return "yes";
      if (v === "no" || v === "n" || v === "false") return "no";
      return null;
    };

    // Helper function to normalize relationship type values
    const normalizeRelationshipType = (value: string | null | undefined): string | null => {
      if (!value) return null;
      const normalized = value.toLowerCase().trim();
      // Map UI values to DB values
      const mapping: Record<string, string> = {
        "open relationship": "ethical_non_monogamous",
        "casual dating": "open_to_both",
        "friends with benefits": "open_to_both",
        "long-term relationship": "monogamous",
        "short-term fun": "open_to_both",
        "not sure yet": "open_to_both",
      };
      return mapping[normalized] || normalized;
    };

    // Helper function to normalize education values
    const normalizeEducation = (value: string | null | undefined): string | null => {
      if (!value) return null;
      const normalized = value.toLowerCase().trim();
      // Map UI values to DB values
      const mapping: Record<string, string> = {
        "high school": "high_school",
        "some college": "some_college",
        "bachelor's": "bachelors",
        "master's": "masters",
      };
      return mapping[normalized] || normalized;
    };

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
        // Only show users who currently have at least one dating photo
        userDatingPhotos: { some: {} },
        userDatingProfile: {
          // Match gender preference - check if their gender matches any of our preferred genders
          // Skip this filter if gender is in variabilityFilters (allow any gender)
          ...(preferredGenders.length > 0 && preferredGenders.some(p => p.gender) && (!hasVariability || !variabilityFilters.includes("gender")) ? {
            gender: { in: preferredGenders.map(p => p.gender).filter(Boolean) }
          } : {}),
          // Match age range (only if both min and max are set)
          // Apply variability if age is in variabilityFilters
          ...(preferences.preferredMinAge && preferences.preferredMaxAge ? (() => {
            const ageRange = applyVariabilityToRange(
              preferences.preferredMinAge,
              preferences.preferredMaxAge,
              "age"
            );
            return {
              age: {
                gte: ageRange.min,
                lte: ageRange.max,
              },
            };
          })() : {}),
          // Match height range if specified
          // Apply variability if height is in variabilityFilters
          ...(preferences.preferredMinHeight && preferences.preferredMaxHeight
            ? (() => {
                const heightRange = applyVariabilityToRange(
                  preferences.preferredMinHeight,
                  preferences.preferredMaxHeight,
                  "height"
                );
                return {
                  height: {
                    gte: heightRange.min,
                    lte: heightRange.max,
                  },
                };
              })()
            : {}),
          // Vaccination + Religion are handled in post-processing so we can normalize legacy values
          // Match hasKids preference if specified
          // Apply variability probabilistically in post-processing
          ...(preferences.preferredHasKids && preferences.preferredHasKids !== "any" && (!hasVariability || !variabilityFilters.includes("hasKids"))
            ? {
                hasKids: normalizeValue(preferences.preferredHasKids) === "yes",
              }
            : {}),
          // Match smokes preference if specified
          // Apply variability probabilistically in post-processing
          ...(preferences.preferredSmokes && (!hasVariability || !variabilityFilters.includes("smokes"))
            ? {
                smokes: preferences.preferredSmokes,
              }
            : {}),
          // Match drinks preference if specified
          // Apply variability probabilistically in post-processing
          ...(preferences.preferredDrinks && (!hasVariability || !variabilityFilters.includes("drinks"))
            ? {
                drinks: preferences.preferredDrinks,
              }
            : {}),
          // Match activity preference if specified (preferredActivity is now an array)
          // Apply variability probabilistically in post-processing
          ...(Array.isArray(preferences.preferredActivity) && preferences.preferredActivity.length > 0 && (!hasVariability || !variabilityFilters.includes("activity"))
            ? {
                activity: { in: preferences.preferredActivity },
              }
            : {}),
          // WantsKids is handled in post-processing (normalize not_sure/maybe)
          // Match relationshipType preference if specified
          // Apply variability probabilistically in post-processing
          // Preferences are stored in DB format, so direct comparison
          ...(Array.isArray(preferences.preferredRelationshipType) && preferences.preferredRelationshipType.length > 0 && (!hasVariability || !variabilityFilters.includes("relationshipType"))
            ? {
                relationshipType: { in: preferences.preferredRelationshipType },
              }
            : {}),
          // Match diet preference if specified
          // Apply variability probabilistically in post-processing
          // Preferences are stored in DB format, so direct comparison
          ...(Array.isArray(preferences.preferredDiet) && preferences.preferredDiet.length > 0 && (!hasVariability || !variabilityFilters.includes("diet"))
            ? {
                diet: { in: preferences.preferredDiet },
              }
            : {}),
          // Match politicalViews preference if specified
          // Apply variability probabilistically in post-processing
          // Preferences are stored in DB format, so direct comparison
          ...(Array.isArray(preferences.preferredPoliticalViews) && preferences.preferredPoliticalViews.length > 0 && (!hasVariability || !variabilityFilters.includes("politicalViews"))
            ? {
                politicalViews: { in: preferences.preferredPoliticalViews },
              }
            : {}),
          // Match education preference if specified
          // Apply variability probabilistically in post-processing
          // Preferences are stored in DB format, so direct comparison
          ...(Array.isArray(preferences.preferredEducation) && preferences.preferredEducation.length > 0 && (!hasVariability || !variabilityFilters.includes("education"))
            ? {
                education: { in: preferences.preferredEducation },
              }
            : {}),
          // Body type preference (single-select)
          // Apply variability probabilistically in post-processing
          ...(preferences.preferredBodyType && (!hasVariability || !variabilityFilters.includes("bodyType"))
            ? {
                bodyType: preferences.preferredBodyType,
              }
            : {}),
          // Pets preference (multi-select)
          // Apply variability probabilistically in post-processing
          ...(Array.isArray(preferences.preferredPets) && preferences.preferredPets.length > 0 && (!hasVariability || !variabilityFilters.includes("pets"))
            ? {
                pets: { hasSome: preferences.preferredPets },
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
          take: 5, // Max active photos is 5
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
      // Apply variability if distance is in variabilityFilters
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
        
        // Calculate max distance with variability
        let maxDistanceKm = preferences.preferredMaxDistanceKm;
        if (hasVariability && variabilityFilters.includes("distance")) {
          const expansion = Math.round((maxDistanceKm * variabilityLevel) / 100);
          maxDistanceKm = maxDistanceKm + expansion;
        }
        
        // Filter out matches beyond the SEARCHER's max distance preference (with variability)
        if (distanceKm > maxDistanceKm) {
          if (isDev) {
            console.log(`[Potential Matches] Filtering out match ${match.id}: Distance ${distanceKm.toFixed(2)}km exceeds searcher's max ${maxDistanceKm.toFixed(2)}km`);
          }
          return false;
        }
      }
      
      // Parse their preferredGender (support both formats)
      // New format: sexualOrientation is an array of strings
      let theirPreferredGenders: Array<{ gender: string; sexualOrientation: string[] }> = [];
      try {
        if (match.userDatingPreferences.preferredGender) {
          const parsed = JSON.parse(match.userDatingPreferences.preferredGender);
          if (Array.isArray(parsed)) {
            // New format: array of gender preferences
            theirPreferredGenders = parsed.filter(p => p && p.gender).map(p => ({
              gender: p.gender,
              sexualOrientation: Array.isArray(p.sexualOrientation) ? p.sexualOrientation : (p.sexualOrientation ? [p.sexualOrientation] : [])
            }));
          } else if (typeof parsed === 'string') {
            // JSON string containing a single gender string
            theirPreferredGenders = [{
              gender: parsed,
              sexualOrientation: match.userDatingPreferences.preferredSexualOrientation ? [match.userDatingPreferences.preferredSexualOrientation] : []
            }];
          } else {
            // Parsed object but not an array (shouldn't happen, but handle gracefully)
            theirPreferredGenders = [{
              gender: match.userDatingPreferences.preferredGender,
              sexualOrientation: match.userDatingPreferences.preferredSexualOrientation ? [match.userDatingPreferences.preferredSexualOrientation] : []
            }];
          }
        }
      } catch {
        // Not JSON, use as single value (old format)
        if (match.userDatingPreferences.preferredGender) {
          theirPreferredGenders = [{
            gender: match.userDatingPreferences.preferredGender,
            sexualOrientation: match.userDatingPreferences.preferredSexualOrientation ? [match.userDatingPreferences.preferredSexualOrientation] : []
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
      
      // Check reciprocal gender preference with probabilistic variability
      const genderMatches = theirPreferredGenders.some(pref => {
        const genderMatch = pref.gender?.toLowerCase() === ourGender.toLowerCase();
        const orientationMatch = Array.isArray(pref.sexualOrientation) 
          ? pref.sexualOrientation.some(orientation => orientation.toLowerCase() === ourOrientation.toLowerCase())
          : false;
        return genderMatch && orientationMatch;
      });
      
      // Apply probabilistic variability to gender matching
      if (hasVariability && variabilityFilters.includes("gender") && !genderMatches) {
        // With variability: X% chance to allow this match even if gender doesn't match
        const random = Math.random() * 100;
        if (random < variabilityLevel) {
          // Variability allows this match (outside preference)
          return true;
        }
        // Variability didn't allow it, so require normal match
        return false;
      }
      
      if (!genderMatches && isDev) {
        console.log(`[Potential Matches] Filtering out match ${match.id}: No reciprocal preference match. Our: ${ourGender}/${ourOrientation}, Their preferences:`, theirPreferredGenders);
      }
      
      return genderMatches;
    });

    // Apply probabilistic variability filtering to categorical filters in post-processing
    // This allows matches outside preferences X% of the time based on variabilityLevel
    const variabilityFilteredMatches = reciprocalMatches.filter((match) => {
      if (!match.userDatingProfile) return true;

      const profile = match.userDatingProfile;

      // -------------------------
      // Preference behavior for "no preference" / missing profile fields
      //
      // - If a preference is NOT set (null/empty/[]/"any"), it should not filter anyone out.
      // - If a preference IS set, require a match (unless variability includes that filter).
      // - If the match has "Prefer not to say" (null), they will not satisfy a set preference.
      // -------------------------

      // Vaccination (supports legacy "Yes"/"No")
      if (preferences.preferredCoronavirusVaccinated) {
        const pref = normalizeYesNo(preferences.preferredCoronavirusVaccinated);
        const prof = normalizeYesNo(profile.coronavirusVaccinated);
        const matchesPreference = !!pref && !!prof && pref === prof;

        if (hasVariability && variabilityFilters.includes("vaccination") && !matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) return false;
        } else if ((!hasVariability || !variabilityFilters.includes("vaccination")) && !matchesPreference) {
          return false;
        }
      }

      // Religion (normalize legacy values like "Christian" vs "Christianity")
      if (Array.isArray(preferences.preferredReligions) && preferences.preferredReligions.length > 0) {
        const prefSet = new Set(
          preferences.preferredReligions.map(normalizeReligion).filter(Boolean) as string[],
        );
        const prof = normalizeReligion(profile.religion);
        const matchesPreference = !!prof && prefSet.has(prof);

        if (hasVariability && variabilityFilters.includes("religion") && !matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) return false;
        } else if ((!hasVariability || !variabilityFilters.includes("religion")) && !matchesPreference) {
          return false;
        }
      }

      // HasKids filter with variability
      if (hasVariability && variabilityFilters.includes("hasKids") && preferences.preferredHasKids && preferences.preferredHasKids !== "any") {
        const preferredHasKidsBool = normalizeValue(preferences.preferredHasKids) === "yes";
        const matchesPreference = profile.hasKids === preferredHasKidsBool;
        if (!matchesPreference) {
          // Variability: X% chance to show outside preference, (100-X)% chance to require match
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            // (100-X)% of the time: require match (show within preference)
            return false;
          }
          // X% of the time: allow it (show outside preference)
        }
      }

      // WantsKids (strict + variability; normalize not_sure -> maybe)
      if (preferences.preferredWantsKids && preferences.preferredWantsKids !== "any") {
        const profileWantsKids = normalizeValue(profile.wantsKids);
        const preferredWantsKids = normalizeValue(preferences.preferredWantsKids);
        const normalizedProfile = profileWantsKids === "not_sure" ? "maybe" : profileWantsKids;
        const matchesPreference =
          !!preferredWantsKids && !!normalizedProfile && normalizedProfile === preferredWantsKids;

        if (hasVariability && variabilityFilters.includes("wantsKids") && !matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) return false;
        } else if ((!hasVariability || !variabilityFilters.includes("wantsKids")) && !matchesPreference) {
          return false;
        }
      }

      // Smokes filter with variability
      if (hasVariability && variabilityFilters.includes("smokes") && preferences.preferredSmokes) {
        const matchesPreference = profile.smokes === preferences.preferredSmokes;
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      // Drinks filter with variability
      if (hasVariability && variabilityFilters.includes("drinks") && preferences.preferredDrinks) {
        const matchesPreference = profile.drinks === preferences.preferredDrinks;
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      // Activity filter with variability
      if (hasVariability && variabilityFilters.includes("activity") && Array.isArray(preferences.preferredActivity) && preferences.preferredActivity.length > 0) {
        const matchesPreference = profile.activity && preferences.preferredActivity.includes(profile.activity);
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      // RelationshipType filter with variability
      // Preferences are in DB format, profile may need normalization
      if (hasVariability && variabilityFilters.includes("relationshipType") && Array.isArray(preferences.preferredRelationshipType) && preferences.preferredRelationshipType.length > 0) {
        const normalizedProfile = normalizeRelationshipType(profile.relationshipType);
        // Preferences are already in DB format, so direct comparison
        const matchesPreference = normalizedProfile && preferences.preferredRelationshipType.includes(normalizedProfile);
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      // Diet filter with variability
      // Preferences are in DB format, profile may need normalization
      if (hasVariability && variabilityFilters.includes("diet") && Array.isArray(preferences.preferredDiet) && preferences.preferredDiet.length > 0) {
        const normalizedProfile = normalizeValue(profile.diet);
        // Preferences are already in DB format, so direct comparison
        const matchesPreference = normalizedProfile && preferences.preferredDiet.includes(normalizedProfile);
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      // PoliticalViews filter with variability
      // Preferences are in DB format, profile may need normalization
      if (hasVariability && variabilityFilters.includes("politicalViews") && Array.isArray(preferences.preferredPoliticalViews) && preferences.preferredPoliticalViews.length > 0) {
        const normalizedProfile = normalizeValue(profile.politicalViews);
        // Preferences are already in DB format, so direct comparison
        const matchesPreference = normalizedProfile && preferences.preferredPoliticalViews.includes(normalizedProfile);
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      // Education filter with variability
      // Preferences are in DB format, profile may need normalization
      if (hasVariability && variabilityFilters.includes("education") && Array.isArray(preferences.preferredEducation) && preferences.preferredEducation.length > 0) {
        const normalizedProfile = normalizeEducation(profile.education);
        // Preferences are already in DB format, so direct comparison
        const matchesPreference = normalizedProfile && preferences.preferredEducation.includes(normalizedProfile);
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      // Body type filter with variability (single-select)
      if (hasVariability && variabilityFilters.includes("bodyType") && preferences.preferredBodyType) {
        const matchesPreference = profile.bodyType && profile.bodyType === preferences.preferredBodyType;
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      // Pets filter with variability (multi-select)
      if (hasVariability && variabilityFilters.includes("pets") && Array.isArray(preferences.preferredPets) && preferences.preferredPets.length > 0) {
        const matchesPreference =
          Array.isArray(profile.pets) && profile.pets.some((p) => preferences.preferredPets.includes(p));
        if (!matchesPreference) {
          const random = Math.random() * 100;
          if (random >= variabilityLevel) {
            return false;
          }
        }
      }

      return true;
    });

    if (isDev) {
      console.log(`[Potential Matches] Filtered to ${variabilityFilteredMatches.length} matches after variability filtering (from ${reciprocalMatches.length} reciprocal matches)`);
    }

    // Early return if no matches after filtering
    if (variabilityFilteredMatches.length === 0) {
      return NextResponse.json({
        matches: [],
        nextCursor: null,
      });
    }

    // Batch fetch post counts for all matches to reduce database queries
    const formatStart = Date.now();
    const matchIds = variabilityFilteredMatches.map(m => m.id);
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
      variabilityFilteredMatches.map(async (match) => {
        // Find primary photo (or use first photo if no primary set)
        const primaryPhoto =
          match.userDatingPhotos.find((p: { isPrimary: boolean }) => p.isPrimary) ||
          match.userDatingPhotos[0];
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
          bodyType: match.userDatingProfile?.bodyType || null,
          bio: match.userDatingProfile?.bio || match.bio || "",
          hasKids: match.userDatingProfile?.hasKids ?? null,
          smokes: match.userDatingProfile?.smokes || null,
          drinks: match.userDatingProfile?.drinks || null,
          activity: match.userDatingProfile?.activity || null,
          education: match.userDatingProfile?.education || null,
          job: match.userDatingProfile?.job || null,
          pets: match.userDatingProfile?.pets || [],
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

