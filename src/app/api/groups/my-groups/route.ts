import { NextRequest, NextResponse } from "next/server";
// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";

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
      take: pageSize + 1,
      skip: cursor ? 1 : 0,
      ...(cursor && {
        cursor: {
          userId_groupId: {
            userId: user.id,
            groupId: cursor,
          },
        },
      }),
    });

    const groups = groupMemberships.map((membership) => membership.group);

    const hasNextPage = groups.length > pageSize;
    const nextCursor = hasNextPage ? groups[groups.length - 1].id : null;

    if (hasNextPage) groups.pop();

    return NextResponse.json({ groups, nextCursor });
  } catch (error) {
    console.error("Error fetching user's groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
