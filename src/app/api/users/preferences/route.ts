import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";
//  // Remove this line
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { geocodeZipCode } from "@/lib/server/geocodeZipCode";

export async function GET() {
  try {
    // Direct session validation (required)
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    // --- End direct session validation
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Original GET logic using loggedInUser
    const userId = loggedInUser.id;
    if (typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      // If preferences don't exist yet, return safe defaults (no 404)
      calendarPreference: userPreferences?.calendar ?? "PRIVATE",
      zipCode: userPreferences?.zipCode ?? "",
    });
  } catch (error) {
    console.error("Error fetching user calendar preference:", error);
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Direct session validation (required)
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    // --- End direct session validation
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { calendar, zipCode } = await req.json();

    const normalizedZip =
      typeof zipCode === "string" ? zipCode.trim() : undefined;

    const geo =
      typeof normalizedZip === "string" && normalizedZip.length > 0
        ? await geocodeZipCode(normalizedZip)
        : null;

    await prisma.userPreferences.upsert({
      where: { userId: loggedInUser.id },
      create: {
        userId: loggedInUser.id,
        calendar: typeof calendar === "string" ? calendar : "PRIVATE",
        zipCode:
          normalizedZip && normalizedZip.length > 0 ? normalizedZip : null,
        latitude: geo?.lat ?? null,
        longitude: geo?.lon ?? null,
      },
      update: {
        ...(typeof calendar === "string" ? { calendar } : {}),
        ...(zipCode !== undefined
          ? {
              zipCode:
                normalizedZip && normalizedZip.length > 0
                  ? normalizedZip
                  : null,
              latitude: geo?.lat ?? null,
              longitude: geo?.lon ?? null,
            }
          : {}),
      },
    });

    return NextResponse.json({ message: "Preferences updated" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return serverError();
  }
}
