import prisma from "@/lib/prisma";
import { EventsPage, getEventDataInclude } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/auth";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

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

    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isCancelled: false,
      },
      orderBy: { when: "asc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: getEventDataInclude(user.id),
    });

    const nextCursor = events.length > pageSize ? events[pageSize].id : null;

    const data: EventsPage = {
      events: events.slice(0, pageSize),
      nextCursor,
    };

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
