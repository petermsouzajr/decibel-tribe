import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import { DEFAULT_PAGE_SIZE, cursorArgs, paginate } from "@/lib/api/pagination";
import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ groupId: string }> },
) {
  const params = await props.params;
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = DEFAULT_PAGE_SIZE;

    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    const groupId = params.groupId;

    // An invite creates a GroupMember row with acceptedInvite: false, so the
    // row existing is not the same as being a member. Without this filter a
    // pending invitee could read every post in the group before accepting.
    // my-groups and posts/group-activity already filter on acceptedInvite, and
    // the group page derives `isMember` from it too — this route was the
    // outlier.
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
      select: { acceptedInvite: true },
    });

    if (!membership?.acceptedInvite) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this group." },
        { status: 403 },
      );
    }

    const posts = await prisma.post.findMany({
      where: {
        groupId,
        user: {
          deletedAt: null,
          // Match the other feeds: hide posts from users the viewer blocked.
          blocksReceived: { none: { blockerId: user.id } },
        },
      },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      ...cursorArgs(cursor ? { id: cursor } : undefined, pageSize),
    });

    const { items, nextCursor } = paginate(posts, pageSize);

    const typedPosts = items;

    const data: PostsPage = { posts: typedPosts, nextCursor };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/groups/[groupId]/posts:", error);
    return serverError();
  }
}
