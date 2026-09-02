import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import { DEFAULT_PAGE_SIZE, cursorArgs, paginate } from "@/lib/api/pagination";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = DEFAULT_PAGE_SIZE;

    const userGroups = await prisma.groupMember.findMany({
      where: { userId: user.id, acceptedInvite: true },
      select: { groupId: true },
    });

    const groupIds = userGroups.map((g) => g.groupId);

    const posts = await prisma.post.findMany({
      where: {
        groupId: { in: groupIds },
      },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      ...cursorArgs(cursor ? { id: cursor } : undefined, pageSize),
    });

    const { items, nextCursor } = paginate(posts, pageSize);

    const typedPosts = items;

    const data: PostsPage = {
      posts: typedPosts,
      nextCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching group activity:", error);
    return serverError();
  }
}
