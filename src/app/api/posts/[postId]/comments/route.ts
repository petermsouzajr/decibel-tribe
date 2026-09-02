import { validateRequestWithCookieMutation } from "@/auth";
import { unauthorized, serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { CommentsPage, getCommentDataInclude } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse
import { CommentData } from "@/lib/types"; // Ensure CommentData is imported

// GET Handler
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> },
) {
  const params = await props.params;

  const { postId } = params;

  try {
    // Optional auth: anonymous readers may view comments, they just get
    // the public shape of the payload.
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    const loggedInUserId = loggedInUser?.id;

    // Original GET logic (uses loggedInUserId which might be undefined)
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 5;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only fetch top-level comments (not replies)
        isDeleted: false, // Filter out deleted comments
        user: {
          deletedAt: null,
          ...(loggedInUserId
            ? { blocksReceived: { none: { blockerId: loggedInUserId } } }
            : {}),
        },
      },
      include: getCommentDataInclude(loggedInUserId), // Pass potentially undefined ID
      orderBy: { createdAt: "asc" },
      take: -pageSize - 1,
      skip: cursor ? 1 : undefined,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.log("Database query result - comments found:", comments.length);
      console.log(
        "Sample comment data:",
        comments[0]
          ? {
              id: comments[0].id,
              isDeleted: comments[0].isDeleted,
              content: comments[0].content.substring(0, 50),
            }
          : "No comments",
      );
    }

    const previousCursor = comments.length > pageSize ? comments[0].id : null;

    const data: CommentsPage = {
      comments: comments.length > pageSize ? comments.slice(1) : comments,
      previousCursor,
    };

    if (isDev) {
      console.log(
        "API returning comments:",
        data.comments.map((c) => ({
          id: c.id,
          isDeleted: c.isDeleted,
          content: c.content.substring(0, 50),
        })),
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return serverError();
  }
}

// POST Handler
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> },
) {
  const params = await props.params;

  const { postId } = params;

  try {
    // Direct session validation (required for posting comments)
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    // --- End direct session validation
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();

    // Add content validation check
    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    // Transaction to create comment and potentially notification
    const [comment, postAuthor] = await Promise.all([
      prisma.comment.create({
        data: {
          content: content.trim(), // Trim content
          postId,
          userId: user.id,
        },
        include: getCommentDataInclude(user.id),
      }),
      prisma.post.findUnique({
        // Find post author
        where: { id: postId },
        select: { userId: true },
      }),
    ]);

    // --- Notification Logic ---
    if (postAuthor && postAuthor.userId !== user.id) {
      // Only notify if commenter is not the post author
      try {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: "COMMENT",
            issuerId: user.id,
            postId: postId,
            recipientId: postAuthor.userId,
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              type: "COMMENT",
              issuerId: user.id,
              recipientId: postAuthor.userId,
              postId: postId,
            },
          });
        }
      } catch (notificationError) {
        // Log error but don't fail the request
        console.error("Failed to create notification:", notificationError);
      }
    }
    // --- End Notification Logic ---

    return NextResponse.json(comment as CommentData, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    // Keep generic 500 fallback
    return serverError();
  }
}
