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
    } = await request.json();

    // Update user bio if provided
    if (bio !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { bio },
      });
    }

    // Create or update user dating profile
    if (
      age !== undefined ||
      height !== undefined ||
      gender !== undefined ||
      location !== undefined ||
      coronavirusVaccinated !== undefined ||
      religion !== undefined ||
      sexualOrientation !== undefined
    ) {
      await prisma.user_dating_profile.upsert({
        where: {
          userId: user.id,
        },
        update: {
          ...(age !== undefined && { age }),
          ...(height !== undefined && { height }),
          ...(gender !== undefined && { gender }),
          ...(location !== undefined && { location }),
          ...(coronavirusVaccinated !== undefined && {
            coronavirusVaccinated,
          }),
          ...(religion !== undefined && { religion }),
          ...(sexualOrientation !== undefined && { sexualOrientation }),
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          userId: user.id,
          age: age || null,
          height: height || null,
          gender: gender || null,
          location: location || null,
          coronavirusVaccinated: coronavirusVaccinated || null,
          religion: religion || null,
          sexualOrientation: sexualOrientation || null,
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
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        preferredGender: preferredGender || null,
        preferredSexualOrientation: preferredSexualOrientation || null,
        preferredMinAge: preferredMinAge || 18,
        preferredMaxAge: preferredMaxAge || 100,
        preferredMinHeight: preferredMinHeight || null,
        preferredMaxHeight: preferredMaxHeight || null,
        preferredMaxDistanceKm: preferredMaxDistance || 50,
        preferredCoronavirusVaccinated: preferredCoronavirusVaccinated || null,
        preferredReligions: preferredReligions || [],
        preferredInstruments: preferredInstruments || [],
        preferredSkills: preferredSkills || [],
        matchMusicTastes: matchMusicTastes !== undefined ? matchMusicTastes : true,
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
