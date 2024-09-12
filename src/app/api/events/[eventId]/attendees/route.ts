import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params;
  if (!eventId) {
    return NextResponse.json(
      { error: "Event ID is required" },
      { status: 400 },
    );
  }

  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch attendees for the specified event
    const attendees = await prisma.eventAttendee.findMany({
      where: {
        eventId: eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true, // Add any other fields you want to include
          },
        },
      },
    });

    if (attendees.length === 0) {
      return NextResponse.json(
        { message: "No attendees found for this event" },
        { status: 404 },
      );
    }

    return NextResponse.json(attendees, { status: 200 });
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params;
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if the attendee already exists
    const existingAttendee = await prisma.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId,
        },
      },
    });

    if (existingAttendee) {
      return NextResponse.json(
        { error: "User is already an attendee of this event" },
        { status: 400 },
      );
    }

    // Add the attendee if they don't already exist
    const attendee = await prisma.eventAttendee.create({
      data: {
        eventId: eventId,
        userId: user.id,
      },
    });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { createdById: true }, // Get the event creator's ID
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (user.id !== event.createdById) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          issuerId: user.id,
          recipientId: event.createdById,
          eventId: eventId,
          type: "EVENT_ATTENDEE",
        },
      });

      if (!existingNotification) {
        // Create the notification if it doesn't exist
        await prisma.notification.create({
          data: {
            issuerId: user.id, // The user who attended the event
            recipientId: event.createdById, // The event creator
            eventId: eventId, // Event ID for the notification
            type: "EVENT_ATTENDEE", // Notification type
          },
        });
      }
    }

    return NextResponse.json(attendee, { status: 201 });
  } catch (error) {
    console.error("Error adding attendee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params;
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if the attendee exists
    const existingAttendee = await prisma.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId,
        },
      },
    });

    if (!existingAttendee) {
      return NextResponse.json(
        { error: "User is not an attendee of this event" },
        { status: 400 },
      );
    }

    // Remove the attendee
    await prisma.eventAttendee.delete({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId,
        },
      },
    });

    return NextResponse.json({ message: "Attendee removed" }, { status: 200 });
  } catch (error) {
    console.error("Error removing attendee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
