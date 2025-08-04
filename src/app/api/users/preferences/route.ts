import { NextRequest, NextResponse } from "next/server";
// import { validateRequest } from "@/auth"; // Remove this line
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Direct session validation (required)
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
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

    if (!userPreferences) {
      return NextResponse.json(
        { error: "User preferences not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      calendarPreference: userPreferences.calendar,
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
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    // --- End direct session validation
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Original PATCH logic using loggedInUser
    const { calendar } = await req.json();

    await prisma.userPreferences.upsert({
      where: { userId: loggedInUser.id },
      create: { userId: loggedInUser.id, calendar },
      update: { calendar },
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
