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
      bio: userData?.bio,
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
      location,
      coronavirusVaccinated,
      religion,
      sexualOrientation,
    } = await request.json();

    // Update user bio
    if (bio !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { bio },
      });
    }

    // Update or create dating profile
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
        where: { userId: user.id },
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

