// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
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
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor =
      notifications.length > pageSize ? notifications[pageSize].id : null;

    // Explicitly assert the type of the sliced notifications array
    const typedNotifications = notifications.slice(
      0,
      pageSize,
    ) as unknown as NotificationData[];

    const data: NotificationsPage = {
      notifications: typedNotifications, // Use the asserted array
      nextCursor,
    };

    return NextResponse.json(data); // Use NextResponse
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ); // Use NextResponse
  }
}
