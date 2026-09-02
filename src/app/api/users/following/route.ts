import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { DEFAULT_PAGE_SIZE, cursorArgs, paginate } from "@/lib/api/pagination";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    const pageSize = DEFAULT_PAGE_SIZE;
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
    return serverError();
  }
}
