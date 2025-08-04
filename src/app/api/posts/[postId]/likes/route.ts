// import { validateRequest } from "@/auth";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { LikeInfo } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
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
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        likes: {
          where: {
            userId: loggedInUser.id,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const data: LikeInfo = {
      likes: post._count.likes,
      isLikedByUser: !!post.likes.length,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching like info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
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
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.like.upsert({
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
      prisma.dislike.deleteMany({
        where: {
          userId: loggedInUser.id,
          postId,
        },
      }),
    ]);

    return NextResponse.json({ message: "Post liked" });
  } catch (error) {
    console.error("Error liking post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
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
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.like.deleteMany({
      where: {
        userId: loggedInUser.id,
        postId,
      },
    });

    return NextResponse.json({ message: "Like removed" });
  } catch (error) {
    console.error("Error removing like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
