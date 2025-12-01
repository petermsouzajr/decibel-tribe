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

    // Check if dating is active
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isDatingActive: true },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    // Get active location override (not expired)
    const override = await prisma.dating_location_overrides.findUnique({
      where: { userId: user.id },
    });

    if (!override) {
      return NextResponse.json({ active: false });
    }

    // Check if expired
    const now = new Date();
    if (override.expiresAt < now) {
      // Delete expired override
      await prisma.dating_location_overrides.delete({
        where: { id: override.id },
      });
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      latitude: override.latitude,
      longitude: override.longitude,
      city: override.city,
      expiresAt: override.expiresAt,
      createdAt: override.createdAt,
    });
  } catch (error) {
    console.error("Error fetching location override:", error);
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

    // Check if dating is active
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isDatingActive: true },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    const { latitude, longitude, city, durationDays = 7 } = await request.json();

    if (!latitude || !longitude || !city) {
      return NextResponse.json(
        { error: "latitude, longitude, and city are required" },
        { status: 400 }
      );
    }

    // Validate latitude/longitude
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: "Invalid latitude. Must be between -90 and 90." },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Invalid longitude. Must be between -180 and 180." },
        { status: 400 }
      );
    }

    // Calculate expiration date (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (durationDays || 7));

    // Create or update location override
    const override = await prisma.dating_location_overrides.upsert({
      where: { userId: user.id },
      update: {
        latitude,
        longitude,
        city,
        expiresAt,
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        latitude,
        longitude,
        city,
        expiresAt,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      latitude: override.latitude,
      longitude: override.longitude,
      city: override.city,
      expiresAt: override.expiresAt,
    });
  } catch (error) {
    console.error("Error setting location override:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete location override
    await prisma.dating_location_overrides.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location override:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


