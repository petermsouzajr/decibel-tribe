import { NextRequest, NextResponse } from "next/server";
import { forbidden, serverError, unauthorized } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getEventDataInclude } from "@/lib/types";
import { replaceEventSchema, updateEventSchema } from "@/lib/validation";
import { geocodeZipCode } from "@/lib/server/geocodeZipCode";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> },
) {
  const params = await props.params;
  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    const eventId = params.eventId;

    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      // getEventDataInclude already selects helpWantedSkills with the skill's
      // id and name. Re-declaring a narrower select here was what forced the
      // `as any`, which then cascaded into casts on every read below.
      include: getEventDataInclude(loggedInUser?.id ?? ""),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === "DRAFT" && event.createdById !== loggedInUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const helpWanted = event.helpWantedSkills
      .map((h) => h.skill?.name)
      .filter(Boolean);

    const isOwner = event.createdById === loggedInUser.id;

    // Strip location data by destructuring rather than deleting off an `any`,
    // so the response shape stays checked. Only the owner's editor receives the
    // zip, and raw coordinates are never exposed.
    const { zipCode, latitude, longitude, ...rest } = event;
    const safeEvent = {
      ...rest,
      helpWantedSkills: helpWanted,
      eventZipCode: isOwner ? (zipCode ?? "") : undefined,
    };

    return NextResponse.json(safeEvent, { status: 200 });
  } catch (error) {
    console.error("Error fetching event:", error);
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> },
) {
  const params = await props.params;
  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
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
        return serverError();
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
        if (
          delError instanceof Prisma.PrismaClientKnownRequestError &&
          delError.code === "P2025"
        ) {
          console.warn(
            `Attempted to unattend, but attendee not found: user=${loggedInUser.id}, event=${eventId}`,
          );
          return NextResponse.json({ message: "Success" });
        }
        console.error("Unattend failed:", delError);
        return serverError();
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
        return forbidden();
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
        return serverError();
      }
    }
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> },
) {
  const params = await props.params;
  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
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

    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = replaceEventSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 },
      );
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
      helpWantedSkills,
      eventZipCode,
      status,
      visibility,
      isCancelled,
    } = validation.data;

    const wasCancelled = event.isCancelled;
    const isNowCancelled = isCancelled;

    const wantsHelp =
      Array.isArray(helpWantedSkills) && helpWantedSkills.length > 0;
    const normalizedZip =
      typeof eventZipCode === "string" ? eventZipCode.trim() : "";
    if (wantsHelp && !normalizedZip) {
      return NextResponse.json(
        { error: "Event zip code is required when you add Help Wanted skills" },
        { status: 400 },
      );
    }

    const geo = normalizedZip ? await geocodeZipCode(normalizedZip) : null;

    const updatedEvent = await prisma.$transaction(async (tx) => {
      const skillIds = await Promise.all(
        (Array.isArray(helpWantedSkills) ? helpWantedSkills : []).map(
          async (skillName: string) => {
            const skill = await tx.skill.upsert({
              where: { name: skillName },
              update: {},
              create: { name: skillName },
            });
            return skill.id;
          },
        ),
      );

      const updated = await tx.event.update({
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
          zipCode: normalizedZip || null,
          latitude: geo?.lat ?? null,
          longitude: geo?.lon ?? null,
          status,
          visibility,
          isCancelled,
          helpWantedSkills: {
            deleteMany: {},
            create: skillIds.map((skillId) => ({ skillId })),
          },
        },
      });

      return updated;
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

    return NextResponse.json(
      {
        ...updatedEvent,
        zipCode: null,
        latitude: null,
        longitude: null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating event:", error);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> },
) {
  const params = await props.params;
  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
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
    return serverError();
  }
}
