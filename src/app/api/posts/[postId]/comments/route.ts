// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { CommentsPage, getCommentDataInclude } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse
import { CommentData } from "@/lib/types"; // Ensure CommentData is imported

// GET Handler
export async function GET(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    // Direct session validation (allowing anonymous access for viewing comments)
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    let loggedInUserId: string | undefined;
    if (sessionId) {
      const { user, session } = await lucia.validateSession(sessionId);
      if (session && session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      loggedInUserId = user?.id; // Set if session is valid
    }
    // --- End direct session validation

    // Original GET logic (uses loggedInUserId which might be undefined)
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 5;

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: getCommentDataInclude(loggedInUserId), // Pass potentially undefined ID
      orderBy: { createdAt: "asc" },
      take: -pageSize - 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const previousCursor = comments.length > pageSize ? comments[0].id : null;

    const data: CommentsPage = {
      comments: comments.length > pageSize ? comments.slice(1) : comments,
      previousCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST Handler
export async function POST(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    // Direct session validation (required for posting comments)
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user, session } = await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    // --- End direct session validation
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Original POST logic using user
    const { content } = await req.json();

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: user.id,
      },
      include: getCommentDataInclude(user.id), // Pass user ID
    });

    // ... (rest of POST logic, e.g., notifications)

    return NextResponse.json(comment as CommentData, { status: 201 }); // Use NextResponse and type assertion
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
