import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function GET() {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
