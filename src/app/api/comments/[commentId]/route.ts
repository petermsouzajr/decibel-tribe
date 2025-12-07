import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createCommentSchema } from "@/lib/validation";

export async function PUT(request: NextRequest, props: { params: Promise<{ commentId: string }> }) {
  const params = await props.params;
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    const { commentId } = params;

    // Validate content
    const { content: validatedContent } = createCommentSchema.parse({ content });

    // Check if comment exists and belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { 
        id: true, 
        userId: true, 
        postId: true,
        isDeleted: true,
        createdAt: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.isDeleted) {
      return NextResponse.json({ error: "Comment is deleted" }, { status: 404 });
    }

    if (comment.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if comment is within edit window (5 minutes)
    const editWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
    const timeSinceCreation = Date.now() - comment.createdAt.getTime();
    
    if (timeSinceCreation > editWindow) {
      return NextResponse.json(
        { error: "Comment can only be edited within 5 minutes of creation" },
        { status: 400 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: validatedContent,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Revalidate the post page
    revalidatePath(`/posts/${comment.postId}`);

    return NextResponse.json({ success: true, comment: updatedComment });
  } catch (error) {
    console.error("Error in comment edit API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 