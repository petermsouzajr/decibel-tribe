import { validateRequestWithCookieMutation } from "@/auth";
import { unauthorized, serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import {
  getEventDataInclude,
  getPostDataInclude,
  getUserDataSelect,
  PostData,
  UserWithFollowerStatus,
} from "@/lib/types";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse
import { parse, isValid, addDays } from "date-fns";
import { Prisma } from "@prisma/client";

// Opt out of static generation
export const dynamic = "force-dynamic";

async function fetchValidEvents(loggedInUserId: string, username?: string) {
  let eventConditions: Prisma.EventWhereInput = {};

  if (username) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { calendar: true },
    });

    const isCalendarPublic = userPreferences?.calendar === "PUBLIC";

    if (loggedInUserId && loggedInUserId === user.id) {
      eventConditions = {
        createdById: user.id,
      };
    } else if (isCalendarPublic) {
      eventConditions = {
        OR: [
          {
            AND: [
              { createdById: user.id },
              { status: "PUBLISHED" },
              { visibility: "PUBLIC" },
              { isCancelled: false },
            ],
          },
          {
            AND: [
              {
                attendees: {
                  some: {
                    userId: user.id,
                  },
                },
              },
              { status: "PUBLISHED" },
              { visibility: "PUBLIC" },
              { isCancelled: false },
            ],
          },
        ],
      };
    } else {
      return [];
    }
  } else if (loggedInUserId) {
    eventConditions = {
      OR: [
        {
          createdById: loggedInUserId,
        },
        {
          attendees: {
            some: {
              userId: loggedInUserId,
            },
          },
          status: "PUBLISHED",
        },
      ],
    };
  } else {
    eventConditions = {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isCancelled: false,
    };
  }

  const events = await prisma.event.findMany({
    where: eventConditions,
    orderBy: {
      when: "asc",
    },
    include: getEventDataInclude(loggedInUserId),
  });

  return events;
}

function filterEvents(events: any[], q: string) {
  const qLower = q.toLowerCase();
  const dateFormats = [
    "MM/dd/yy",
    "MMMM d yyyy",
    "yyyy-MM-dd",
    "M/d/yyyy",
    "MMM d yyyy",
  ];

  let parsedDate: Date | null = null;
  for (const format of dateFormats) {
    const date = parse(q, format, new Date());
    if (isValid(date)) {
      parsedDate = date;
      break;
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesTitle = event.title.toLowerCase().includes(qLower);

    const matchesDescription = event.description
      ? event.description.toLowerCase().includes(qLower)
      : false;

    const matchesLocation = event.location.toLowerCase().includes(qLower);

    const matchesPerformers = event.performers?.some((performer: string) =>
      performer.toLowerCase().includes(qLower),
    );

    let matchesDate = false;
    if (parsedDate) {
      const eventDate = new Date(event.when);
      matchesDate =
        eventDate >= parsedDate && eventDate < addDays(parsedDate, 1);
    }

    return (
      matchesTitle ||
      matchesDescription ||
      matchesLocation ||
      matchesPerformers ||
      matchesDate
    );
  });

  filteredEvents.sort(
    (a, b) => new Date(a.when).getTime() - new Date(b.when).getTime(),
  );

  return filteredEvents;
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    // const category = req.nextUrl.searchParams.get("category") || "users"; // Category not used currently?

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Direct session validation
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    // --- End direct session validation

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageSize = 10;
    const searchQuery = query.trim();

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { content: { contains: searchQuery, mode: "insensitive" } },
          {
            user: {
              displayName: { contains: searchQuery, mode: "insensitive" },
              deletedAt: null, // Filter out posts from deleted users
            },
          },
          {
            user: {
              username: { contains: searchQuery, mode: "insensitive" },
              deletedAt: null, // Filter out posts from deleted users
            },
          },
        ],
        user: {
          deletedAt: null, // Filter out posts from deleted users
        },
      },
      // Ensure include uses the logged-in user ID
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize,
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery, mode: "insensitive" } },
          { displayName: { contains: searchQuery, mode: "insensitive" } },
        ],
        deletedAt: null, // Filter out deleted users
      },
      // Ensure include uses the logged-in user ID
      select: getUserDataSelect(user.id),
      take: pageSize,
    });

    const events = await fetchValidEvents(user.id);
    const filteredEvents = filterEvents(events, searchQuery);

    // --- Assert types before returning ---
    const typedUsers = users;
    const typedPosts = posts;
    // EventData type might need similar assertion if used directly

    return NextResponse.json({
      users: typedUsers,
      posts: typedPosts,
      events: filteredEvents.slice(0, pageSize), // Assuming EventData typing is handled elsewhere or simple
    });
  } catch (error) {
    console.error("Error in GET /api/search:", error);
    return serverError();
  }
}
