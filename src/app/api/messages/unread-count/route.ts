import { validateRequestWithCookieMutation } from "@/auth";
import { getUnreadCountSafe } from "@/lib/stream";
import { MessageCountInfo } from "@/lib/types";
import { NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";
import { NextRequest } from "next/server";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Direct session validation
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    // --- End direct session validation

    if (!user) {
      // Should technically be covered by !session, but double-check
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadCount = await getUnreadCountSafe(user);
    const data: MessageCountInfo = { unreadCount };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/messages/unread-count:", error);
    // Ensure catch block returns NextResponse
    return serverError();
  }
}
