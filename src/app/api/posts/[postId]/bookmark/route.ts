// import { validateRequest } from "@/auth";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { BookmarkInfo } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;

  const {
    postId
  } = params;

  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: loggedInUser.id,
          postId,
        },
      },
    });

    const data: BookmarkInfo = {
      isBookmarkedByUser: !!bookmark,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching bookmark info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;

  const {
    postId
  } = params;

  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.bookmark.create({
      data: {
        userId: loggedInUser.id,
        postId,
      },
    });

    return NextResponse.json({ message: "Post bookmarked" });
  } catch (error) {
    console.error("Error bookmarking post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;

  const {
    postId
  } = params;

  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: loggedInUser, session } =
      await lucia.validateSession(sessionId);
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.bookmark.deleteMany({
      where: {
        userId: loggedInUser.id,
        postId,
      },
    });

    return NextResponse.json({ message: "Bookmark removed" });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
