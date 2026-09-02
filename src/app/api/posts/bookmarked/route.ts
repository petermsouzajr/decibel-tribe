import { validateRequestWithCookieMutation } from "@/auth";
import { unauthorized, serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import { cursorArgs, paginate } from "@/lib/api/pagination";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    // Direct session validation
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
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
      ...cursorArgs(cursor ? { id: cursor } : undefined, pageSize),
    });

    const { items, nextCursor } = paginate(posts, pageSize);

    const typedPosts = items as unknown as PostData[];

    const data: PostsPage = { posts: typedPosts, nextCursor }; // Use the asserted array

    return NextResponse.json(data); // Use NextResponse
  } catch (error) {
    console.error("Error in GET /api/posts/bookmarked:", error);
    return serverError(); // Use NextResponse
  }
}
