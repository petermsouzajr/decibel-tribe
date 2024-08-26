import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequest();
    console.log("User validated:", loggedInUser);

    const events = await prisma.event.findMany({
      where: {
        isCancelled: false, // You can filter out canceled events if needed
        OR: [
          {
            status: "PUBLISHED",
          },
          {
            status: "DRAFT",
            createdById: loggedInUser?.id, // Show drafts only to their creators
          },
        ],
      },
      orderBy: {
        when: "asc", // Order events by date
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
    console.log("Received request to create event");
    const { user: loggedInUser } = await validateRequest();
    console.log("User validated:", loggedInUser);

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
    } = await req.json();
    console.log("Event details:", {
      title,
      location,
      description,
      url,
      when,
      startTime,
      endTime,
      performers,
      status,
    });

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

    console.log("Event created successfully:", newEvent);
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
