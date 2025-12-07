// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function GET(req: NextRequest, props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  const { eventId } = params;
  if (!eventId) {
    return NextResponse.json(
      { error: "Event ID is required" },
      { status: 400 },
    );
  }

  try {
    // Direct session validation
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user, session } = await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    // --- End direct session validation
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
            avatarUrl: true,
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

export async function POST(req: NextRequest, props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  try {
    // Direct session validation (apply here)
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user, session } = await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    // --- End direct session validation
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;

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

    const attendee = await prisma.eventAttendee.create({
      data: {
        eventId: eventId,
        userId: user.id,
      },
    });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { createdById: true },
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
        await prisma.notification.create({
          data: {
            issuerId: user.id,
            recipientId: event.createdById,
            eventId: eventId,
            type: "EVENT_ATTENDEE",
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

export async function DELETE(req: NextRequest, props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  try {
    // Direct session validation (apply here)
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user, session } = await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    // --- End direct session validation
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;

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
