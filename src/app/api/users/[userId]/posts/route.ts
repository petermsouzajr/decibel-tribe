// import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";

export async function GET(req: NextRequest, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const { user: loggedInUser, session } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const posts = await prisma.post.findMany({
      where: {
        userId: params.userId,
        groupId: null,
        user: {
          deletedAt: null,
          // If the viewer blocked this author, return nothing
          blocksReceived: { none: { blockerId: loggedInUser.id } },
        },
      },
      include: getPostDataInclude(loggedInUser.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const typedPosts = posts.slice(0, pageSize) as unknown as PostData[];

    const data: PostsPage = { posts: typedPosts, nextCursor };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
