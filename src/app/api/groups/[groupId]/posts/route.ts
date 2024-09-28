import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groupId = params.groupId;
    const pageSize = 10;
    const cursor = req.nextUrl.searchParams.get("cursor");

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

    return NextResponse.json({ posts, nextCursor });
  } catch (error) {
    console.error("Error fetching group posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
