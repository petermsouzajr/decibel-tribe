import { validateRequestWithCookieMutation } from "@/auth";
import { unauthorized, serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse
import { revalidatePath } from "next/cache";

// POST Handler (Follow)
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params;

  const { userId } = params;

  try {
    // Direct session validation (required)
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
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
    return serverError();
  }
}

// DELETE Handler (Unfollow)
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params;

  const { userId } = params;

  try {
    // Direct session validation (required)
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
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
    return serverError();
  }
}
