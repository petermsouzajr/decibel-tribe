import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { LikeInfo } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> },
) {
  const params = await props.params;

  const { postId } = params;

  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        likes: {
          where: {
            userId: loggedInUser.id,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const data: LikeInfo = {
      likes: post._count.likes,
      isLikedByUser: !!post.likes.length,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching like info:", error);
    return serverError();
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> },
) {
  const params = await props.params;

  const { postId } = params;

  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.like.upsert({
        where: {
          userId_postId: {
            userId: loggedInUser.id,
            postId,
          },
        },
        create: {
          userId: loggedInUser.id,
          postId,
        },
        update: {},
      }),
      prisma.dislike.deleteMany({
        where: {
          userId: loggedInUser.id,
          postId,
        },
      }),
      // Liking clears a previous dislike, so drop the dislike notification too.
      prisma.notification.deleteMany({
        where: { issuerId: loggedInUser.id, postId, type: "DISLIKE" },
      }),
    ]);

    // Notify the author. Self-likes are skipped and a repeat like does not
    // create a second notification, matching the COMMENT and EVENT_ATTENDEE
    // producers.
    if (post.userId !== loggedInUser.id) {
      const existing = await prisma.notification.findFirst({
        where: {
          recipientId: post.userId,
          issuerId: loggedInUser.id,
          postId,
          type: "LIKE",
        },
        select: { id: true },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            issuerId: loggedInUser.id,
            recipientId: post.userId,
            postId,
            type: "LIKE",
          },
        });
      }
    }

    return NextResponse.json({ message: "Post liked" });
  } catch (error) {
    console.error("Error liking post:", error);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> },
) {
  const params = await props.params;

  const { postId } = params;

  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    // Withdraw the notification with the like, so the author is not left with
    // a notification for something that no longer exists.
    await prisma.$transaction([
      prisma.like.deleteMany({
        where: {
          userId: loggedInUser.id,
          postId,
        },
      }),
      prisma.notification.deleteMany({
        where: { issuerId: loggedInUser.id, postId, type: "LIKE" },
      }),
    ]);

    return NextResponse.json({ message: "Like removed" });
  } catch (error) {
    console.error("Error removing like:", error);
    return serverError();
  }
}
