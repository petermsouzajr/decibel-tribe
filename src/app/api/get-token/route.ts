// import { validateRequest } from "@/auth";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import { StreamChat } from "stream-chat";
import { NextRequest, NextResponse } from "next/server";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streamClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_KEY!,
      process.env.STREAM_SECRET!,
    );

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60;

    const token = streamClient.createToken(user.id, expirationTime);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error getting Stream token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
