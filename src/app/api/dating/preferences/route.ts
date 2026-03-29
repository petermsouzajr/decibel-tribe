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
import { normalizeBodyTypeValue, normalizePetsArray } from "@/lib/dating/profileOptions";

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
      bodyType,
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
      preferredMaxDistanceKm,
      preferredCoronavirusVaccinated,
      preferredReligions,
      preferredBodyType,
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
      preferredPets,
      variabilityLevel,
      variabilityFilters,
      idVerificationFilter,
    } = await request.json();

    const normalizedPets = pets === undefined ? undefined : normalizePetsArray(pets);
    const normalizedBodyType =
      bodyType === undefined ? undefined : normalizeBodyTypeValue(bodyType);

    // Accept either `preferredMaxDistance` (km) or legacy `preferredMaxDistanceKm`
    const maxDistanceKm: number | undefined =
      typeof preferredMaxDistance === "number"
        ? preferredMaxDistance
        : typeof preferredMaxDistanceKm === "number"
          ? preferredMaxDistanceKm
          : undefined;

    const normalizeYesNo = (value: unknown): string | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") return null;
      const v = value.trim().toLowerCase();
      if (!v) return null;
      if (v === "yes" || v === "y" || v === "true") return "yes";
      if (v === "no" || v === "n" || v === "false") return "no";
      return v;
    };

    const normalizeHasKidsPref = (value: unknown): string | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") return null;
      const v = value.trim().toLowerCase();
      if (!v) return null;
      if (v === "any") return "any";
      if (v === "yes") return "yes";
      if (v === "no") return "no";
      // handle legacy values
      if (v === "y" || v === "true") return "yes";
      if (v === "n" || v === "false") return "no";
      return v;
    };

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
      bodyType !== undefined ||
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
          ...(bodyType !== undefined && {
            bodyType: normalizedBodyType ? normalizedBodyType : null,
          }),
          ...(sexualOrientation !== undefined && { sexualOrientation }),
          ...(hasKids !== undefined && { hasKids }),
          ...(smokes !== undefined && { smokes }),
          ...(drinks !== undefined && { drinks }),
          ...(activity !== undefined && { activity }),
          ...(education !== undefined && { education }),
          ...(job !== undefined && { job }),
          ...(pets !== undefined && { pets: normalizedPets }),
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
          bodyType: normalizedBodyType ? normalizedBodyType : null,
          sexualOrientation: sexualOrientation || null,
          hasKids: hasKids ?? null,
          smokes: smokes || null,
          drinks: drinks || null,
          activity: activity || null,
          education: education || null,
          job: job || null,
          pets: normalizedPets ?? [],
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
        ...(maxDistanceKm !== undefined && {
          preferredMaxDistanceKm: maxDistanceKm,
        }),
        ...(preferredCoronavirusVaccinated !== undefined && {
          preferredCoronavirusVaccinated: normalizeYesNo(preferredCoronavirusVaccinated),
        }),
        ...(preferredReligions !== undefined && { preferredReligions }),
        ...(preferredBodyType !== undefined && {
          preferredBodyType:
            typeof preferredBodyType === "string" && preferredBodyType.trim().length > 0
              ? preferredBodyType
              : null,
        }),
        ...(preferredInstruments !== undefined && { preferredInstruments }),
        ...(preferredSkills !== undefined && { preferredSkills }),
        ...(matchMusicTastes !== undefined && { matchMusicTastes }),
        ...(preferredHasKids !== undefined && { preferredHasKids: normalizeHasKidsPref(preferredHasKids) }),
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
        ...(preferredPets !== undefined && {
          preferredPets: Array.isArray(preferredPets) ? preferredPets : [],
        }),
        ...(variabilityLevel !== undefined && { variabilityLevel }),
        ...(variabilityFilters !== undefined && { variabilityFilters }),
        ...(idVerificationFilter !== undefined && { idVerificationFilter }),
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
        preferredMaxDistanceKm: maxDistanceKm || 50,
        preferredCoronavirusVaccinated: normalizeYesNo(preferredCoronavirusVaccinated) || null,
        preferredReligions: preferredReligions || [],
        preferredBodyType:
          typeof preferredBodyType === "string" && preferredBodyType.trim().length > 0
            ? preferredBodyType
            : null,
        preferredInstruments: preferredInstruments || [],
        preferredSkills: preferredSkills || [],
        matchMusicTastes: matchMusicTastes !== undefined ? matchMusicTastes : true,
        preferredHasKids: normalizeHasKidsPref(preferredHasKids) || null,
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
        preferredPets: Array.isArray(preferredPets) ? preferredPets : [],
        variabilityLevel: variabilityLevel !== undefined ? variabilityLevel : 0,
        variabilityFilters: variabilityFilters || [],
        idVerificationFilter: idVerificationFilter || "show_id_verified_only",
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
