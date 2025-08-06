import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
      heightUnit,
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
      preferredHeightUnit,
      preferredMaxDistance,
      preferredDistanceUnit,
      preferredCoronavirusVaccinated,
      preferredReligions,
    } = await request.json();

    // Update user bio (still in User table)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        bio,
      },
    });

    // Create or update user dating profile
    await prisma.user_dating_profile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        age,
        height,
        heightUnit,
        gender,
        location,
        coronavirusVaccinated,
        religion,
        sexualOrientation,
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        age,
        height,
        heightUnit,
        gender,
        location,
        coronavirusVaccinated,
        religion,
        sexualOrientation,
        updatedAt: new Date(),
      },
    });

    // Create or update user dating preferences
    const datingPreferences = await prisma.user_dating_preferences.upsert({
      where: {
        userId: user.id,
      },
      update: {
        preferredGender,
        preferredSexualOrientation,
        preferredMinAge,
        preferredMaxAge,
        preferredMinHeight,
        preferredMaxHeight,
        preferredHeightUnit,
        preferredMaxDistanceKm: preferredMaxDistance,
        preferredDistanceUnit,
        preferredCoronavirusVaccinated,
        preferredReligions,
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        preferredGender,
        preferredSexualOrientation,
        preferredMinAge,
        preferredMaxAge,
        preferredMinHeight,
        preferredMaxHeight,
        preferredHeightUnit,
        preferredMaxDistanceKm: preferredMaxDistance,
        preferredDistanceUnit,
        preferredCoronavirusVaccinated,
        preferredReligions,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      datingPreferences 
    });
  } catch (error) {
    console.error("Error saving dating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 
