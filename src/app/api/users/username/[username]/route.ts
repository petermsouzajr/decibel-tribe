// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function GET(req: NextRequest, props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    let loggedInUserId: string | null = null;

    if (sessionId) {
      try {
        const { user, session } = await lucia.validateSession(sessionId);
        if (session) {
          if (session.fresh) {
            // Session is fresh, generate new cookie
            const sessionCookie = lucia.createSessionCookie(session.id);
            (await cookies()).set(
              sessionCookie.name,
              sessionCookie.value,
              sessionCookie.attributes,
            );
          }
          // Session is valid, set the user ID for the select query
          loggedInUserId = user.id;
        } else {
          // Session is invalid, invalidate cookie
          const sessionCookie = lucia.createBlankSessionCookie();
          (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
          );
        }
      } catch (validationError) {
        // Error during validation, treat as unauthenticated
        console.error("Session validation error:", validationError);
        // Invalidate cookie just in case
        const sessionCookie = lucia.createBlankSessionCookie();
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    }

    // Perform database query using the determined loggedInUserId (null if no valid session)
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: getUserDataSelect(loggedInUserId), // Pass null or the user ID
    });

    // Check if user was found
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // User found, return data
    return NextResponse.json(user);
  } catch (error) {
    // Catch errors from database query or unexpected issues
    console.error("Error in GET /api/users/username/[username]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
