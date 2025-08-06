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
        bookmarks: { some: { userId: user.id } },
        groupId: null, // Assuming we only bookmark public posts for now
      },
      include: getPostDataInclude(user.id), // Includes user with followers
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
    });

    let nextCursor: string | null = null;
    if (posts.length > pageSize) {
      if (cursor) {
        nextCursor = posts[pageSize - 1].id;
      } else {
        nextCursor = posts[pageSize].id;
      }
    }

    // Explicitly assert the type of the fetched posts array
    const typedPosts = posts.slice(0, pageSize) as unknown as PostData[];

    const data: PostsPage = { posts: typedPosts, nextCursor }; // Use the asserted array

    return NextResponse.json(data); // Use NextResponse
  } catch (error) {
    console.error("Error in GET /api/posts/bookmarked:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ); // Use NextResponse
  }
}
