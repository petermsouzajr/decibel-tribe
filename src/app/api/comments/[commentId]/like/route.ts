import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest, props: { params: Promise<{ commentId: string }> }) {
  const params = await props.params;
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isLike } = await request.json();
    const { commentId } = params;

    // Check if comment exists and is not deleted
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, isDeleted: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.isDeleted) {
      return NextResponse.json({ error: "Comment is deleted" }, { status: 404 });
    }

    // Check if user already liked/disliked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      // Update existing like/dislike
      const updatedLike = await prisma.commentLike.update({
        where: {
          commentId_userId: {
            commentId,
            userId: user.id,
          },
        },
        data: { isLike },
      });

      return NextResponse.json({ success: true, isLike: updatedLike.isLike });
    } else {
      // Create new like/dislike
      const newLike = await prisma.commentLike.create({
        data: {
          commentId,
          userId: user.id,
          isLike,
        },
      });

      return NextResponse.json({ success: true, isLike: newLike.isLike });
    }
  } catch (error) {
    console.error("Error in comment like API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ commentId: string }> }) {
  const params = await props.params;
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = params;

    // Remove like/dislike
    await prisma.commentLike.deleteMany({
      where: {
        commentId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in comment unlike API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 