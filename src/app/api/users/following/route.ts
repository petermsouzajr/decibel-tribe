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
        following: {
          deletedAt: null, // Filter out deleted users
        },
      },
      select: {
        following: {
          select: getUserDataSelect(loggedInUser.id),
        },
      },
      take: pageSize + 1,
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

    // Determine pagination based on the *original* fetch count FIRST
    const hasNextPage = following.length > pageSize;
    // Calculate nextCursor based on the *last* item fetched (pageSize-th index) IF there was a next page
    const nextCursor = hasNextPage ? following[pageSize].following.id : null;

    // Determine the list to return. Start with the original list.
    let itemsToReturn = following;

    // Handle manual cursor skip. Check if the first item matches the cursor.
    const skippedCursorItem =
      cursor &&
      itemsToReturn.length > 0 &&
      itemsToReturn[0].following.id === cursor;
    if (skippedCursorItem) {
      // If we skipped, the list now starts from the second item.
      itemsToReturn = itemsToReturn.slice(1);
    }

    // Ensure the final list has at most `pageSize` items.
    // If we originally had a next page, but didn't skip the cursor item,
    // the list still has N+1 items, so remove the last one.
    if (hasNextPage && !skippedCursorItem) {
      itemsToReturn.pop(); // Remove the extra item only if we didn't skip
    }

    // Map the final list
    const users = itemsToReturn.map((f) => f.following);

    return NextResponse.json({ users, nextCursor });
  } catch (error) {
    console.error("Error fetching following users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
