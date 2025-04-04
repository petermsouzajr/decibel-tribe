// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } },
) {
  try {
    // Direct session validation
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      // Allow unauthenticated access for public profiles, but mark as null user
      const user = await prisma.user.findUnique({
        where: { username: params.username },
        select: getUserDataSelect(null),
      });
      if (!user)
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json(user);
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
      // Allow unauthenticated access for public profiles, but mark as null user
      const user = await prisma.user.findUnique({
        where: { username: params.username },
        select: getUserDataSelect(null),
      });
      if (!user)
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json(user);
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

    // Now we have a loggedInUser, fetch profile data including follow status
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: getUserDataSelect(loggedInUser?.id), // Use loggedInUser?.id
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in GET /api/users/username/[username]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ); // Use NextResponse
  }
}
