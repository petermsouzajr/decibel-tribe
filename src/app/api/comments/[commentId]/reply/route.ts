import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createCommentSchema } from "@/lib/validation";
import { getCommentDataInclude } from "@/lib/types";

export async function POST(request: NextRequest, props: { params: Promise<{ commentId: string }> }) {
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

    // Check if parent comment exists and is not deleted
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { 
        id: true, 
        isDeleted: true, 
        postId: true,
        userId: true,
        parentId: true, // Ensure we're not replying to a reply (max 1 level deep)
      },
    });

    if (!parentComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (parentComment.isDeleted) {
      return NextResponse.json({ error: "Comment is deleted" }, { status: 404 });
    }

    // Allow replies to replies (industry standard)
    // Most platforms allow multiple levels of threading
    // We'll let the UI handle display depth limits if needed

    // Create the reply
    const reply = await prisma.comment.create({
      data: {
        content: validatedContent,
        userId: user.id,
        postId: parentComment.postId,
        parentId: commentId,
      },
      include: getCommentDataInclude(user.id),
    });

    // Create notification for the parent comment author (if different user)
    if (parentComment.userId !== user.id) {
      await prisma.notification.create({
        data: {
          issuerId: user.id,
          recipientId: parentComment.userId,
          postId: parentComment.postId,
          type: "COMMENT", // We'll use the same notification type for replies
        },
      });
    }

    // Revalidate the post page to show the new reply
    revalidatePath(`/posts/${parentComment.postId}`);

    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.log("Reply API - Created reply:", reply);
      console.log("Reply API - Parent comment:", parentComment);
    }
    
    return NextResponse.json({ 
      success: true, 
      reply,
      postId: parentComment.postId // Include postId for the mutation
    });
  } catch (error) {
    console.error("Error in comment reply API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 