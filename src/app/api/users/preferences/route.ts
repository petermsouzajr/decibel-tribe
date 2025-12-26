import { NextRequest, NextResponse } from "next/server";
// import { validateRequest } from "@/auth"; // Remove this line
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { geocodeZipCode } from "@/lib/server/geocodeZipCode";

export async function GET() {
  try {
    // Direct session validation (required)
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Direct session validation (required)
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
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
        zipCode: normalizedZip && normalizedZip.length > 0 ? normalizedZip : null,
        latitude: geo?.lat ?? null,
        longitude: geo?.lon ?? null,
      },
      update: {
        ...(typeof calendar === "string" ? { calendar } : {}),
        ...(zipCode !== undefined
          ? {
              zipCode: normalizedZip && normalizedZip.length > 0 ? normalizedZip : null,
              latitude: geo?.lat ?? null,
              longitude: geo?.lon ?? null,
            }
          : {}),
      },
    });

    return NextResponse.json({ message: "Preferences updated" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
