import { validateRequestWithCookieMutation } from "@/auth";
import { unauthorized, serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { EventsPage, getEventDataInclude } from "@/lib/types";
import { cursorArgs, paginate } from "@/lib/api/pagination";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Direct session validation
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
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
      ...cursorArgs(cursor ? { id: cursor } : undefined, pageSize),
      orderBy: { when: "asc" },
      include: getEventDataInclude(user.id),
    });

    const { items, nextCursor } = paginate(events, pageSize);

    const data: EventsPage = {
      events: items.map((e: any) => ({
        ...e,
        zipCode: null,
        latitude: null,
        longitude: null,
      })),
      nextCursor,
    };

    return NextResponse.json(data); // Use NextResponse
  } catch (error) {
    console.error("Error in GET /api/events/following:", error);
    return serverError(); // Use NextResponse
  }
}
