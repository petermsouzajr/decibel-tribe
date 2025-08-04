import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getEventDataInclude } from "@/lib/types";
import { updateEventSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
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
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;

    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      include: getEventDataInclude(loggedInUser?.id ?? ""),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    // Direct session validation (required)
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
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
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get eventId from route parameters
    const eventId = params.eventId;

    // Read body and identify action vs update data
    const body = await req.json();
    const { action, ...updateData } = body;

    // --- Handle Actions ---
    if (action === "attend") {
      // Find event owner for notification
      const eventOwner = await prisma.event.findUnique({
        where: { id: eventId },
        select: { createdById: true },
      });

      if (!eventOwner) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      try {
        await prisma.$transaction([
          prisma.eventAttendee.upsert({
            where: {
              userId_eventId: {
                userId: loggedInUser.id,
                eventId: eventId,
              },
            },
            create: {
              userId: loggedInUser.id,
              eventId: eventId,
            },
            update: {},
          }),
          prisma.notification.create({
            data: {
              issuerId: loggedInUser.id,
              recipientId: eventOwner.createdById,
              eventId: eventId,
              type: "EVENT_ATTENDEE",
            },
          }),
        ]);
        return NextResponse.json({ message: "Success" });
      } catch (txError) {
        console.error("Attend transaction failed:", txError);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    } else if (action === "unattend") {
      try {
        await prisma.eventAttendee.delete({
          where: {
            userId_eventId: {
              userId: loggedInUser.id,
              eventId: eventId,
            },
          },
        });
        return NextResponse.json({ message: "Success" });
      } catch (delError) {
        // Handle case where attendee might not exist (e.g., already unattended)
        // Prisma throws P2025 if record to delete is not found.
        // Consider if this should be a 404 or just success/ignored.
        // For now, let's treat as success if delete fails likely due to not found.
        if ((delError as any)?.code === "P2025") {
          console.warn(
            `Attempted to unattend, but attendee not found: user=${loggedInUser.id}, event=${eventId}`,
          );
          return NextResponse.json({ message: "Success" });
        }
        console.error("Unattend failed:", delError);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    } else if (action) {
      // Invalid action provided
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } else {
      // --- Handle Update --- (No action provided)

      // Fetch event to check ownership
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { createdById: true }, // Only need owner ID for check
      });

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // Ownership check - ONLY for updates
      if (event.createdById !== loggedInUser.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Validate incoming data
      const validation = updateEventSchema.safeParse(updateData);

      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid data", details: validation.error.errors },
          { status: 400 },
        );
      }
      const validatedData = validation.data;

      try {
        // Perform update with validated data and include clause
        const updatedEvent = await prisma.event.update({
          where: { id: eventId }, // Use eventId from params
          data: validatedData, // Use validated data
          include: getEventDataInclude(loggedInUser.id), // Include related data
        });

        return NextResponse.json(updatedEvent);
      } catch (updateError) {
        console.error("Event update failed:", updateError);
        // Handle potential Prisma validation errors if Zod validation isn't added/sufficient
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    }
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
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
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
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;

    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== loggedInUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

      const notifications = eventAttendees
        .filter((attendee) => attendee.userId !== event.createdById)
        .map((attendee) =>
          prisma.notification.upsert({
            where: {
              recipientId_eventId_type: {
                recipientId: attendee.userId,
                eventId: event.id,
                type: "EVENT_CANCELLED",
              },
            },
            create: {
              issuerId: event.createdById,
              recipientId: attendee.userId,
              eventId: event.id,
              type: "EVENT_CANCELLED",
            },
            update: {},
          }),
        );

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
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
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;

    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== loggedInUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const deletedEvent = await prisma.event.delete({
      where: {
        id: eventId,
      },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
