// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { EventsPage, getEventDataInclude } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function GET(req: NextRequest) {
  try {
    // Direct session validation
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user, session } = await lucia.validateSession(sessionId);
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const events = await prisma.event.findMany({
      where: {
        createdBy: {
          followers: {
            some: {
              followerId: user.id,
            },
          },
        },
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isCancelled: false,
      },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { when: "asc" },
      include: getEventDataInclude(user.id),
    });

    const nextCursor = events.length > pageSize ? events[pageSize].id : null;

    const data: EventsPage = {
      events: events.slice(0, pageSize),
      nextCursor,
    };

    return NextResponse.json(data); // Use NextResponse
  } catch (error) {
    console.error("Error in GET /api/events/following:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ); // Use NextResponse
  }
}
