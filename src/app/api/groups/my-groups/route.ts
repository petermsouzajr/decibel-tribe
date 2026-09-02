import { NextRequest, NextResponse } from "next/server";
// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { cursorArgs, paginate } from "@/lib/api/pagination";

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

    const pageSize = 10;
    const cursor = req.nextUrl.searchParams.get("cursor");

    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId: user.id, acceptedInvite: true },
      select: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      ...cursorArgs(
        cursor
          ? { userId_groupId: { userId: user.id, groupId: cursor } }
          : undefined,
        pageSize,
      ),
    });

    const { items: groups, nextCursor } = paginate(
      groupMemberships.map((membership) => membership.group),
      pageSize,
    );

    return NextResponse.json({ groups, nextCursor });
  } catch (error) {
    console.error("Error fetching user's groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
