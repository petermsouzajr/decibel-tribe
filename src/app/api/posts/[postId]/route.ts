import { validateRequestWithCookieMutation } from "@/auth";
import { forbidden, serverError, unauthorized } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
// ... other imports ...
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse
import { getPostDataInclude } from "@/lib/types"; // Ensure getPostDataInclude is imported

// GET Handler
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> },
) {
  const params = await props.params;

  const { postId } = params;

  try {
    // Optional auth: anonymous readers are allowed, they just get the
    // public shape of the payload.
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    const loggedInUserId = loggedInUser?.id;

    // Original GET logic using potentially undefined loggedInUserId
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: getPostDataInclude(loggedInUserId), // Pass potentially undefined ID
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return serverError();
  }
}

// PATCH Handler
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> },
) {
  const params = await props.params;

  const { postId } = params;

  try {
    // Direct session validation (required)
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    // --- End direct session validation
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Original PATCH logic using user
    const { content } = await req.json();

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return forbidden();
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
      include: getPostDataInclude(user.id), // Pass user ID
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return serverError();
  }
}

// DELETE Handler
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> },
) {
  const params = await props.params;

  const { postId } = params;

  try {
    // Direct session validation (required)
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    // --- End direct session validation
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Original DELETE logic using user
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return forbidden();
    }

    await prisma.post.delete({ where: { id: postId } });

    // Return 204 No Content using new NextResponse for empty body
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return serverError();
  }
}
