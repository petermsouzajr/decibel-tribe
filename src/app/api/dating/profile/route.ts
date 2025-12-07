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
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          city: data[0].address?.city || data[0].address?.town || data[0].address?.village || data[0].display_name.split(",")[0] || null,
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
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        city: data[0].address?.city || data[0].address?.town || data[0].address?.village || data[0].display_name.split(",")[0] || null,
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
      college,
      job,
      pets,
      interests,
    } = await request.json();

    // Geocode zipCode if provided (only called once when user updates their zip code)
    let city: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    if (zipCode !== undefined && zipCode) {
      const geocoded = await geocodeZipCode(zipCode);
      if (geocoded) {
        city = geocoded.city || null;
        latitude = geocoded.lat;
        longitude = geocoded.lon;
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
      college !== undefined ||
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
          ...(college !== undefined && { college }),
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
          college: college || null,
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

