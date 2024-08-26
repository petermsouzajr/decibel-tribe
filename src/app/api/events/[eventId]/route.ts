import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getEventDataInclude } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    console.log("Received request to fetch event:", params.eventId);

    const { user: loggedInUser } = await validateRequest();
    console.log("User validated:", loggedInUser);

    const eventId = params.eventId;
    console.log("Looking for event with ID:", eventId);

    // Fetch the event using the ID
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      include: getEventDataInclude(loggedInUser?.id ?? ""),
    });

    if (!event) {
      console.log("Event not found with ID:", eventId);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if the user is authorized to view this event
    if (event.status === "DRAFT" && event.createdById !== loggedInUser?.id) {
      console.log("User not authorized to view this draft event");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log("Event found and user authorized:", event);
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

// export async function PUT(req: NextRequest) {
//   try {
//     const { user: loggedInUser } = await validateRequest();

//     if (!loggedInUser) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const {
//       eventId,
//       title,
//       location,
//       description,
//       url,
//       when,
//       startTime,
//       endTime,
//       performers,
//       status,
//     } = await req.json();
//     const event = await prisma.event.findUnique({
//       where: { id: eventId },
//     });

//     if (!event) {
//       return NextResponse.json({ error: "Event not found" }, { status: 404 });
//     }

//     if (event.createdById !== loggedInUser.id) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const updatedEvent = await prisma.event.update({
//       where: { id: eventId },
//       data: {
//         title,
//         location,
//         description,
//         url,
//         when,
//         startTime,
//         endTime,
//         performers,
//         status,
//       },
//     });

//     return NextResponse.json(updatedEvent);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    console.log("Received request to update event:", params.eventId);

    const { user: loggedInUser } = await validateRequest();
    console.log("User validated:", loggedInUser);

    const eventId = params.eventId;
    console.log("Looking for event with ID:", eventId);

    // Fetch the event using the ID
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      console.log("Event not found with ID:", eventId);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if the user is authorized to update this event
    if (event.createdById !== loggedInUser?.id) {
      console.log("User not authorized to update this event");
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
    } = await req.json();

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
      },
    });

    console.log("Event updated successfully:", updatedEvent);
    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
