import { validateRequestWithCookieMutation } from "@/auth";
import { unauthorized, serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { cursorArgs, paginate } from "@/lib/api/pagination";
import { NotificationsPage, NotificationData } from "@/lib/types"; // Import NotificationData
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse
import { getUserDataSelect } from "@/lib/types"; // Corrected import path

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    // Direct session validation
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    // --- End direct session validation

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: user.id,
        issuer: {
          deletedAt: null, // Filter out notifications from deleted users
        },
      },
      include: {
        issuer: {
          select: getUserDataSelect(user.id),
        },
        post: {
          select: {
            id: true,
            content: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
        match: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...cursorArgs(cursor ? { id: cursor } : undefined, pageSize),
    });

    const { items, nextCursor } = paginate(notifications, pageSize);

    const typedNotifications = items as unknown as NotificationData[];

    const data: NotificationsPage = {
      notifications: typedNotifications, // Use the asserted array
      nextCursor,
    };

    return NextResponse.json(data); // Use NextResponse
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return serverError(); // Use NextResponse
  }
}
