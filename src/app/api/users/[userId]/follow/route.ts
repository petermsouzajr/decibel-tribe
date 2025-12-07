// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse
import { revalidatePath } from "next/cache";

// POST Handler (Follow)
export async function POST(req: NextRequest, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;

  const {
    userId
  } = params;

  try {
    // Direct session validation (required)
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
    // --- End direct session validation
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Original POST logic using loggedInUser
    await prisma.follow.create({
      data: {
        followerId: loggedInUser.id,
        followingId: userId,
      },
    });

    revalidatePath("/users/[username]");
    revalidatePath("/users/[username]/followers");

    return NextResponse.json({ message: "Follow successful" });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE Handler (Unfollow)
export async function DELETE(req: NextRequest, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;

  const {
    userId
  } = params;

  try {
    // Direct session validation (required)
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
    // --- End direct session validation
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Original DELETE logic using loggedInUser
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: loggedInUser.id,
          followingId: userId,
        },
      },
    });

    revalidatePath("/users/[username]");
    revalidatePath("/users/[username]/followers");

    return NextResponse.json({ message: "Unfollow successful" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
