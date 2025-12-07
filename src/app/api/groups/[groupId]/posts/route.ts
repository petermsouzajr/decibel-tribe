import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

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

    const groupId = params.groupId;

    const isMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this group." },
        { status: 403 },
      );
    }

    const posts = await prisma.post.findMany({
      where: { groupId },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      skip: cursor ? 1 : 0,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
      }),
    });

    const hasNextPage = posts.length > pageSize;
    const nextCursor = hasNextPage ? posts[posts.length - 1].id : null;

    if (hasNextPage) posts.pop();

    const typedPosts = posts as unknown as PostData[];

    const data: PostsPage = { posts: typedPosts, nextCursor };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/groups/[groupId]/posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
