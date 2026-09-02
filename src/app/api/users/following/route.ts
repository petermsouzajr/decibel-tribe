import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { cursorArgs, paginate } from "@/lib/api/pagination";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
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
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageSize = 10;
    const cursor = req.nextUrl.searchParams.get("cursor");
    const usernameParam = req.nextUrl.searchParams.get("user");

    let userIdToFetch = loggedInUser.id;

    if (usernameParam) {
      const user = await prisma.user.findUnique({
        where: { username: usernameParam },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userIdToFetch = user.id;
    }

    const following = await prisma.follow.findMany({
      where: {
        followerId: userIdToFetch,
        following: {
          deletedAt: null, // Filter out deleted users
        },
      },
      select: {
        following: {
          select: getUserDataSelect(loggedInUser.id),
        },
      },
      ...cursorArgs(
        cursor
          ? {
              followerId_followingId: {
                followerId: userIdToFetch,
                followingId: cursor,
              },
            }
          : undefined,
        pageSize,
      ),
      orderBy: {
        createdAt: "desc",
      },
    });

    const { items, nextCursor } = paginate(
      following,
      pageSize,
      (f) => f.following.id,
    );

    const users = items.map((f) => f.following);

    return NextResponse.json({ users, nextCursor });
  } catch (error) {
    console.error("Error fetching following users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
