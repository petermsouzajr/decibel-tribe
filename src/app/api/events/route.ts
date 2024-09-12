import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("user") ?? undefined;

  try {
    const { user: loggedInUser } = await validateRequest();

    let eventConditions: Prisma.EventWhereInput = {};
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
        select: { calendar: true },
      });

      // If no preferences are found, assume the default is PUBLIC
      const isCalendarPublic = userPreferences?.calendar === "PUBLIC";

      if (loggedInUser && loggedInUser.id === user?.id) {
        // If the logged-in user is the same as the user in the URL, show all events they created
        eventConditions = {
          createdById: user.id,
        };
      } else if (isCalendarPublic) {
        // If no username is provided, show all events for the logged-in user, including private, public, draft, and published events
        eventConditions = {
          OR: [
            // Show events that user A created
            {
              AND: [
                { createdById: user.id }, // Events created by user A
                { status: "PUBLISHED" }, // Only show published events
                { visibility: "PUBLIC" }, // Only show public events
                { isCancelled: false }, // Exclude cancelled events
              ],
            },
            // Show events that user A is attending (but didn't create)
            {
              AND: [
                {
                  attendees: {
                    some: {
                      userId: user.id, // User A is an attendee
                    },
                  },
                },
                { status: "PUBLISHED" }, // Only show published events
                { visibility: "PUBLIC" }, // Only show public events
                { isCancelled: false }, // Exclude cancelled events
              ],
            },
          ],
        };
      } else {
        // If the calendar is private, return an empty response or appropriate error
        return NextResponse.json([], { status: 200 });
      }
    } else {
      // If no username is provided, show all events for the logged-in user, including private, public, draft, and published events
      eventConditions = {
        OR: [
          {
            createdById: loggedInUser?.id,
          },
          {
            attendees: {
              some: {
                userId: loggedInUser?.id,
              },
            },
            status: "PUBLISHED",
          },
        ],
      };
    }

    const events = await prisma.event.findMany({
      where: eventConditions,
      orderBy: {
        when: "asc",
      },
      include: {
        attendees: {
          select: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequest();

    const {
      title,
      location,
      description,
      url,
      when,
      startTime,
      endTime,
      performers,
      status,
      visibility,
      isCancelled,
    } = await req.json();

    const newEvent = await prisma.event.create({
      data: {
        title,
        location,
        description,
        url,
        when,
        startTime,
        endTime,
        performers,
        status,
        visibility,
        isCancelled,
        createdBy: {
          connect: { id: loggedInUser!.id },
        },
        attendees: {
          create: {
            userId: loggedInUser!.id,
          },
        },
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error message:", error.message);
      console.error("Prisma meta:", error.meta);
    } else {
      console.error("Unknown error:", error);
      console.error("Error stack:", (error as Error).stack);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = req.nextUrl.searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { createdBy: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById === loggedInUser.id) {
      // User is the owner, delete the event
      await prisma.event.delete({
        where: { id: eventId },
      });
    } else {
      // User is not the owner, just remove from their calendar
      await prisma.eventAttendee.delete({
        where: {
          userId_eventId: {
            userId: loggedInUser.id,
            eventId,
          },
        },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      eventId,
      title,
      location,
      description,
      url,
      when,
      startTime,
      endTime,
      performers,
      status,
      visibility,
      isCancelled,
    } = await req.json();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== loggedInUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        location,
        description,
        url,
        when,
        startTime,
        endTime,
        performers,
        status,
        visibility,
        isCancelled,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      eventId,
      title,
      location,
      description,
      url,
      when,
      startTime,
      endTime,
      performers,
      status,
      visibility,
      isCancelled,
    } = await req.json();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== loggedInUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        location,
        description,
        url,
        when,
        startTime,
        endTime,
        performers,
        status,
        visibility,
        isCancelled,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
