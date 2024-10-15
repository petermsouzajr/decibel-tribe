import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageSize = 10;
    const cursor = req.nextUrl.searchParams.get("cursor");

    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId: user.id, acceptedInvite: true },
      select: { groupId: true },
    });
    const groupIds = groupMemberships.map((membership) => membership.groupId);

    const posts = await prisma.post.findMany({
      where: {
        groupId: { in: groupIds },
      },
      include: {
        ...getPostDataInclude(user.id),
        Group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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
    console.error("Error fetching group activity posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
