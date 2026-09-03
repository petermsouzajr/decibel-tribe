import { validateRequestWithCookieMutation } from "@/auth";
import { unauthorized, serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return serverError(); // Use NextResponse
  }
}
