import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { DislikeInfo } from "@/lib/types";
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
        dislikes: {
          where: {
            userId: loggedInUser.id,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            dislikes: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const data: DislikeInfo = {
      dislikes: post._count.dislikes,
      isDislikedByUser: !!post.dislikes.length,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dislike info:", error);
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

    await prisma.$transaction([
      prisma.dislike.upsert({
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
      prisma.like.deleteMany({
        where: {
          userId: loggedInUser.id,
          postId,
        },
      }),
    ]);

    return NextResponse.json({ message: "Post disliked" });
  } catch (error) {
    console.error("Error disliking post:", error);

    // Check for Prisma P2025 error (Record Not Found)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fallback to generic 500 error
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

    await prisma.dislike.deleteMany({
      where: {
        userId: loggedInUser.id,
        postId,
      },
    });

    return NextResponse.json({ message: "Dislike removed" });
  } catch (error) {
    console.error("Error removing dislike:", error);
    return serverError();
  }
}
