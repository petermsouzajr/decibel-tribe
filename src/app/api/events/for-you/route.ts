import prisma from "@/lib/prisma";
import { EventsPage, getEventDataInclude } from "@/lib/types";
import { DEFAULT_PAGE_SIZE, cursorArgs, paginate } from "@/lib/api/pagination";
import { NextRequest, NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = DEFAULT_PAGE_SIZE;

    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

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
      ...cursorArgs(cursor ? { id: cursor } : undefined, pageSize),
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

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
