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
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
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
