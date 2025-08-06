// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    // Direct session validation
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

    const posts = await prisma.post.findMany({
      where: {
        groupId: null,
        user: {
          deletedAt: null, // Filter out posts from deleted users
        },
      },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
    });

    // Adjust nextCursor calculation based on whether skip was used
    let nextCursor: string | null = null;
    if (posts.length > pageSize) {
      if (cursor) {
        // If we skipped the cursor, the extra item is at index pageSize - 1
        nextCursor = posts[pageSize - 1].id;
      } else {
        // If we didn't skip, the extra item is at index pageSize
        nextCursor = posts[pageSize].id;
      }
    }

    // Slice always takes the first pageSize items
    const typedPosts = posts.slice(0, pageSize) as unknown as PostData[];

    const data: PostsPage = {
      posts: typedPosts,
      nextCursor,
    };

    return NextResponse.json(data); // Use NextResponse
  } catch (error) {
    console.error("Error in GET /api/posts/for-you:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ); // Use NextResponse
  }
}
