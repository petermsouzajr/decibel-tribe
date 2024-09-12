import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getEventDataInclude } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    const eventId = params.eventId;

    // Fetch the event using the ID
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      include: getEventDataInclude(loggedInUser?.id ?? ""),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if the user is authorized to view this event
    if (event.status === "DRAFT" && event.createdById !== loggedInUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error("Error fetching event:", error);
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    const eventId = params.eventId;

    // Fetch the event using the ID
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if the user is authorized to update this event
    if (event.createdById !== loggedInUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Extract data from the request body
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

    const wasCancelled = event.isCancelled;
    const isNowCancelled = isCancelled;

    // Update the event
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

    if (!wasCancelled && isNowCancelled) {
      const eventAttendees = await prisma.eventAttendee.findMany({
        where: { eventId },
      });

      // Prepare notifications for all attendees except the event creator
      const notifications = eventAttendees
        .filter((attendee) => attendee.userId !== event.createdById)
        .map((attendee) =>
          prisma.notification.upsert({
            where: {
              // Use a compound unique key (you'll need a unique constraint in the schema) or a surrogate ID
              recipientId_eventId_type: {
                recipientId: attendee.userId,
                eventId: event.id,
                type: "EVENT_CANCELLED",
              },
            },
            create: {
              issuerId: event.createdById, // The event creator
              recipientId: attendee.userId, // Attendee being notified
              eventId: event.id, // Event ID for the notification
              type: "EVENT_CANCELLED", // Notification type
            },
            update: {}, // If the notification already exists, no changes needed (you can also set a new field like `read: false`)
          }),
        );

      // Run the upsert notifications in a single transaction
      await prisma.$transaction(notifications);
    }

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
