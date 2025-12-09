import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Geocode zip code to lat/lon/city using OpenStreetMap Nominatim API
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
        // Extract city name from address, avoiding zip code
        let cityName = data[0].address?.city || data[0].address?.town || data[0].address?.village || null;
        
        // If no city in address, try to extract from display_name
        if (!cityName && data[0].display_name) {
          const parts = data[0].display_name.split(",");
          // Usually format is: "City, State, Country" or "Neighborhood, City, State"
          // Try to find a non-numeric part that's not a state abbreviation
          for (const part of parts) {
            const trimmed = part.trim();
            // Skip if it's numeric (could be zip code) or too short, or is a state abbreviation
            if (trimmed && !/^\d+$/.test(trimmed) && trimmed.length > 2 && trimmed.length < 50) {
              cityName = trimmed;
              break;
            }
          }
        }
        
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          city: cityName || null,
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
      // Extract city name from address, avoiding zip code
      let cityName = data[0].address?.city || data[0].address?.town || data[0].address?.village || null;
      
      // If no city in address, try to extract from display_name
      if (!cityName && data[0].display_name) {
        const parts = data[0].display_name.split(",");
        // Usually format is: "City, State, Country" or "Neighborhood, City, State"
        // Try to find a non-numeric part that's not a state abbreviation
        for (const part of parts) {
          const trimmed = part.trim();
          // Skip if it's numeric (could be zip code) or too short, or is a state abbreviation
          if (trimmed && !/^\d+$/.test(trimmed) && trimmed.length > 2 && trimmed.length < 50) {
            cityName = trimmed;
            break;
          }
        }
      }
      
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        city: cityName || null,
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

    // Get user's dating profile and preferences
    const profile = await prisma.user_dating_profile.findUnique({
      where: { userId: user.id },
    });

    const preferences = await prisma.user_dating_preferences.findUnique({
      where: { userId: user.id },
    });

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        bio: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      profile,
      preferences,
      bio: profile?.bio || userData?.bio || "",
      avatarUrl: userData?.avatarUrl,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      bio,
      age,
      height,
      gender,
      zipCode,
      coronavirusVaccinated,
      religion,
      sexualOrientation,
      hasKids,
      smokes,
      drinks,
      activity,
      education,
      job,
      pets,
      interests,
    } = await request.json();

    // Geocode zipCode if provided (only called once when user updates their zip code)
    let city: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    if (zipCode !== undefined && zipCode && zipCode.trim()) {
      const geocoded = await geocodeZipCode(zipCode.trim());
      if (geocoded) {
        // Only set city if geocoding returned a valid city name (not zip code)
        if (geocoded.city && geocoded.city.trim() && geocoded.city !== zipCode.trim()) {
          city = geocoded.city.trim();
        }
        latitude = geocoded.lat;
        longitude = geocoded.lon;
      } else {
        // If geocoding fails, log it but don't set city to zipCode
        if (process.env.NODE_ENV === "development") {
          console.log(`[Profile Update] Geocoding failed for zip code: ${zipCode}`);
        }
      }
    }

    // Update or create dating profile (including bio)
    if (
      bio !== undefined ||
      age !== undefined ||
      height !== undefined ||
      gender !== undefined ||
      zipCode !== undefined ||
      coronavirusVaccinated !== undefined ||
      religion !== undefined ||
      sexualOrientation !== undefined ||
      hasKids !== undefined ||
      smokes !== undefined ||
      drinks !== undefined ||
      activity !== undefined ||
      education !== undefined ||
      job !== undefined ||
      pets !== undefined ||
      interests !== undefined ||
      city !== null ||
      latitude !== null ||
      longitude !== null
    ) {
      await prisma.user_dating_profile.upsert({
        where: { userId: user.id },
        update: {
          ...(bio !== undefined && { bio }),
          ...(age !== undefined && { age }),
          ...(height !== undefined && { height: Math.round(height) }), // Round to integer
          ...(gender !== undefined && { gender }),
          ...(zipCode !== undefined && { zipCode }),
          ...(city !== null && { city }),
          ...(latitude !== null && { latitude }),
          ...(longitude !== null && { longitude }),
          ...(coronavirusVaccinated !== undefined && {
            coronavirusVaccinated,
          }),
          ...(religion !== undefined && { religion }),
          ...(sexualOrientation !== undefined && { sexualOrientation }),
          ...(hasKids !== undefined && { hasKids }),
          ...(smokes !== undefined && { smokes }),
          ...(drinks !== undefined && { drinks }),
          ...(activity !== undefined && { activity }),
          ...(education !== undefined && { education }),
          ...(job !== undefined && { job }),
          ...(pets !== undefined && { pets }),
          ...(interests !== undefined && { interests }),
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          userId: user.id,
          bio: bio || null,
          age: age || null,
          height: height ? Math.round(height) : null, // Round to integer
          gender: gender || null,
          zipCode: zipCode || null,
          city: city,
          latitude: latitude,
          longitude: longitude,
          coronavirusVaccinated: coronavirusVaccinated || null,
          religion: religion || null,
          sexualOrientation: sexualOrientation || null,
          hasKids: hasKids ?? null,
          smokes: smokes || null,
          drinks: drinks || null,
          activity: activity || null,
          education: education || null,
          job: job || null,
          pets: pets || null,
          interests: interests || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

