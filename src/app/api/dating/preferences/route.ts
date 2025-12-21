import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  normalizeEducationArrayToDB,
  normalizeRelationshipTypeArrayToDB,
  normalizeValueArrayToDB,
  normalizeEducationArrayToUI,
  normalizeRelationshipTypeArrayToUI,
  normalizeValueArrayToUI,
} from "@/lib/dating/valueNormalization";

// Geocode zip code to lat/lon/city using OpenStreetMap Nominatim API
async function geocodeZipCode(zipCode: string): Promise<{ lat: number; lon: number; city?: string } | null> {
  try {
    const cleanZip = zipCode.trim().replace(/\s+/g, "");
    
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

    const preferences = await prisma.userDatingPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences not found" },
        { status: 404 }
      );
    }

    // Convert DB format to UI format for display
    return NextResponse.json({
      ...preferences,
      preferredEducation: normalizeEducationArrayToUI(preferences.preferredEducation),
      preferredPoliticalViews: normalizeValueArrayToUI(preferences.preferredPoliticalViews),
      preferredDiet: normalizeValueArrayToUI(preferences.preferredDiet),
      preferredRelationshipType: normalizeRelationshipTypeArrayToUI(preferences.preferredRelationshipType),
      preferredActivity: normalizeValueArrayToUI(preferences.preferredActivity),
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      preferredGender,
      preferredSexualOrientation,
      preferredMinAge,
      preferredMaxAge,
      preferredMinHeight,
      preferredMaxHeight,
      preferredMaxDistance,
      preferredCoronavirusVaccinated,
      preferredReligions,
      preferredInstruments,
      preferredSkills,
      matchMusicTastes,
      preferredHasKids,
      preferredWantsKids,
      preferredSmokes,
      preferredDrinks,
      preferredActivity,
      preferredEducation,
      preferredPoliticalViews,
      preferredDiet,
      preferredRelationshipType,
      variabilityLevel,
      variabilityFilters,
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

    // Create or update user dating profile (including dating-specific bio)
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
      await prisma.userDatingProfile.upsert({
        where: {
          userId: user.id,
        },
        update: {
          ...(bio !== undefined && { bio }),
          ...(age !== undefined && { age }),
          ...(height !== undefined && { height }),
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
          height: height || null,
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
          updatedAt: new Date(),
        },
      });
    }

    // Create or update user dating preferences
    const datingPreferences = await prisma.userDatingPreferences.upsert({
      where: {
        userId: user.id,
      },
      update: {
        ...(preferredGender !== undefined && { preferredGender }),
        ...(preferredSexualOrientation !== undefined && {
          preferredSexualOrientation,
        }),
        ...(preferredMinAge !== undefined && { preferredMinAge }),
        ...(preferredMaxAge !== undefined && { preferredMaxAge }),
        ...(preferredMinHeight !== undefined && { preferredMinHeight }),
        ...(preferredMaxHeight !== undefined && { preferredMaxHeight }),
        ...(preferredMaxDistance !== undefined && {
          preferredMaxDistanceKm: preferredMaxDistance,
        }),
        ...(preferredCoronavirusVaccinated !== undefined && {
          preferredCoronavirusVaccinated,
        }),
        ...(preferredReligions !== undefined && { preferredReligions }),
        ...(preferredInstruments !== undefined && { preferredInstruments }),
        ...(preferredSkills !== undefined && { preferredSkills }),
        ...(matchMusicTastes !== undefined && { matchMusicTastes }),
        ...(preferredHasKids !== undefined && { preferredHasKids }),
        ...(preferredWantsKids !== undefined && { preferredWantsKids }),
        ...(preferredSmokes !== undefined && { preferredSmokes }),
        ...(preferredDrinks !== undefined && { preferredDrinks }),
        ...(preferredActivity !== undefined && { 
          preferredActivity: Array.isArray(preferredActivity) 
            ? normalizeValueArrayToDB(preferredActivity) 
            : (preferredActivity ? normalizeValueArrayToDB([preferredActivity]) : []) 
        }),
        ...(preferredEducation !== undefined && { 
          preferredEducation: Array.isArray(preferredEducation) 
            ? normalizeEducationArrayToDB(preferredEducation) 
            : [] 
        }),
        ...(preferredPoliticalViews !== undefined && { 
          preferredPoliticalViews: Array.isArray(preferredPoliticalViews) 
            ? normalizeValueArrayToDB(preferredPoliticalViews) 
            : [] 
        }),
        ...(preferredDiet !== undefined && { 
          preferredDiet: Array.isArray(preferredDiet) 
            ? normalizeValueArrayToDB(preferredDiet) 
            : [] 
        }),
        ...(preferredRelationshipType !== undefined && { 
          preferredRelationshipType: Array.isArray(preferredRelationshipType) 
            ? normalizeRelationshipTypeArrayToDB(preferredRelationshipType) 
            : [] 
        }),
        ...(variabilityLevel !== undefined && { variabilityLevel }),
        ...(variabilityFilters !== undefined && { variabilityFilters }),
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        preferredGender: preferredGender || null,
        preferredSexualOrientation: preferredSexualOrientation || null,
        preferredMinAge: preferredMinAge || 18,
        preferredMaxAge: preferredMaxAge || 130,
          preferredMinHeight: preferredMinHeight ? Math.round(preferredMinHeight) : null,
          preferredMaxHeight: preferredMaxHeight ? Math.round(preferredMaxHeight) : null,
        preferredMaxDistanceKm: preferredMaxDistance || 50,
        preferredCoronavirusVaccinated: preferredCoronavirusVaccinated || null,
        preferredReligions: preferredReligions || [],
        preferredInstruments: preferredInstruments || [],
        preferredSkills: preferredSkills || [],
        matchMusicTastes: matchMusicTastes !== undefined ? matchMusicTastes : true,
        preferredHasKids: preferredHasKids || null,
        preferredWantsKids: preferredWantsKids || null,
        preferredSmokes: preferredSmokes || null,
        preferredDrinks: preferredDrinks || null,
        preferredActivity: Array.isArray(preferredActivity) 
          ? normalizeValueArrayToDB(preferredActivity) 
          : (preferredActivity ? normalizeValueArrayToDB([preferredActivity]) : []),
        preferredEducation: Array.isArray(preferredEducation) 
          ? normalizeEducationArrayToDB(preferredEducation) 
          : [],
        preferredPoliticalViews: Array.isArray(preferredPoliticalViews) 
          ? normalizeValueArrayToDB(preferredPoliticalViews) 
          : [],
        preferredDiet: Array.isArray(preferredDiet) 
          ? normalizeValueArrayToDB(preferredDiet) 
          : [],
        preferredRelationshipType: Array.isArray(preferredRelationshipType) 
          ? normalizeRelationshipTypeArrayToDB(preferredRelationshipType) 
          : [],
        variabilityLevel: variabilityLevel !== undefined ? variabilityLevel : 0,
        variabilityFilters: variabilityFilters || [],
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      datingPreferences,
    });
  } catch (error) {
    console.error("Error saving dating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
