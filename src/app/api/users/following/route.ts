import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
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
      },
      select: {
        following: {
          select: getUserDataSelect(loggedInUser.id),
        },
      },
      take: pageSize + 1,
      skip: cursor ? 1 : 0,
      ...(cursor && {
        cursor: {
          followerId_followingId: {
            followerId: userIdToFetch,
            followingId: cursor,
          },
        },
      }),
      orderBy: {
        createdAt: "desc",
      },
    });

    const users = following.map((f) => f.following);

    const hasNextPage = users.length > pageSize;
    const nextCursor = hasNextPage ? users[users.length - 1].id : null;

    if (hasNextPage) users.pop();

    return NextResponse.json({ users, nextCursor });
  } catch (error) {
    console.error("Error fetching following users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
