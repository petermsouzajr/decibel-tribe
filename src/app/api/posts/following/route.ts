// import { validateRequest } from "@/auth";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import { cursorArgs, paginate } from "@/lib/api/pagination";
import { NextRequest, NextResponse } from "next/server";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followingUserIds = await prisma.follow
      .findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      })
      .then((res) => res.map((follow) => follow.followingId));

    const posts = await prisma.post.findMany({
      where: {
        user: {
          followers: { some: { followerId: user.id } },
          deletedAt: null,
          blocksReceived: { none: { blockerId: user.id } },
        },
        groupId: null,
      },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      ...cursorArgs(cursor ? { id: cursor } : undefined, pageSize),
    });

    const { items, nextCursor } = paginate(posts, pageSize);

    const typedPosts = items as unknown as PostData[];

    const data: PostsPage = {
      posts: typedPosts,
      nextCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching following posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
