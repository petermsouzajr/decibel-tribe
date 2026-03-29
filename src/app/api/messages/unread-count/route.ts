import { lucia } from "@/auth";
import { cookies } from "next/headers";
import { getUnreadCountSafe } from "@/lib/stream";
import { MessageCountInfo } from "@/lib/types";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Direct session validation
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionId);

    if (!session) {
      // Set blank cookie if session is invalid
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session && session.fresh) {
      // Refresh cookie if session is fresh
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
