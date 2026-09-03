import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import { DEFAULT_PAGE_SIZE, cursorArgs, paginate } from "@/lib/api/pagination";
import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = DEFAULT_PAGE_SIZE;

    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

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

    const data: PostsPage = {
      posts: items,
      nextCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching following posts:", error);
    return serverError();
  }
}
