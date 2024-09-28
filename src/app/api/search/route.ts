import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  getEventDataInclude,
  getPostDataInclude,
  getUserDataSelect,
} from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { parse, isValid, addDays } from "date-fns";
import { Prisma } from "@prisma/client";

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
    const q = req.nextUrl.searchParams.get("q") || "";

    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (typeof q !== "string") {
      throw new Error("Invalid query");
    }

    const searchQuery = q.trim();

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          {
            content: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            user: {
              displayName: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              username: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            displayName: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            bio: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
      },
      select: getUserDataSelect(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
    });

    const allEvents = await fetchValidEvents(user.id);
    const filteredEvents = filterEvents(allEvents, q);

    const usersWithSkills = await prisma.user.findMany({
      where: {
        userSkills: {
          some: {
            skill: {
              name: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
      },
      select: getUserDataSelect(user.id),
      take: pageSize + 1,
    });

    const usersWithInstruments = await prisma.user.findMany({
      where: {
        userInstruments: {
          some: {
            instrument: {
              name: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
      },
      select: getUserDataSelect(user.id),
      take: pageSize + 1,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    return NextResponse.json({
      posts: posts.slice(0, pageSize),
      users: users.slice(0, pageSize),
      events: filteredEvents.slice(0, pageSize),
      usersWithSkills: usersWithSkills.slice(0, pageSize),
      usersWithInstruments: usersWithInstruments.slice(0, pageSize),
      nextCursor,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
