import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.user_dating_preferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(preferences);
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
      location,
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
      preferredSmokes,
      preferredDrinks,
      preferredActivity,
    } = await request.json();

    // Create or update user dating profile (including dating-specific bio)
    if (
      bio !== undefined ||
      age !== undefined ||
      height !== undefined ||
      gender !== undefined ||
      location !== undefined ||
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
      interests !== undefined
    ) {
      await prisma.user_dating_profile.upsert({
        where: {
          userId: user.id,
        },
        update: {
          ...(bio !== undefined && { bio }),
          ...(age !== undefined && { age }),
          ...(height !== undefined && { height }),
          ...(gender !== undefined && { gender }),
          ...(location !== undefined && { location }),
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
          height: height || null,
          gender: gender || null,
          location: location || null,
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
          updatedAt: new Date(),
        },
      });
    }

    // Create or update user dating preferences
    const datingPreferences = await prisma.user_dating_preferences.upsert({
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
        ...(preferredSmokes !== undefined && { preferredSmokes }),
        ...(preferredDrinks !== undefined && { preferredDrinks }),
        ...(preferredActivity !== undefined && { preferredActivity }),
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
        preferredSmokes: preferredSmokes || null,
        preferredDrinks: preferredDrinks || null,
        preferredActivity: preferredActivity || null,
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
