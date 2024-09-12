import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  EventsPage,
  getEventDataInclude,
  getPostDataInclude,
  getUserDataSelect,
  PostsPage,
} from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: {
        createdBy: {
          followers: {
            some: {
              followerId: user.id, // Only events from users followed by logged-in user
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
    console.log("events", events);
    console.log("events.length", events.length);
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
