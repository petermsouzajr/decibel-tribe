import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { FollowerInfo, getUserDataSelect } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params;

  const { userId } = params;

  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        followers: {
          where: {
            followerId: loggedInUser.id,
          },
          select: {
            followerId: true,
          },
        },
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: FollowerInfo = {
      followers: user._count.followers,
      isFollowedByUser: !!user.followers.length,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching follower info:", error);
    return serverError();
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params;

  const { userId } = params;

  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    if (userId === loggedInUser.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: loggedInUser.id,
            followingId: userId,
          },
        },
        create: {
          followerId: loggedInUser.id,
          followingId: userId,
        },
        update: {},
      }),
      prisma.notification.create({
        data: {
          issuerId: loggedInUser.id,
          recipientId: userId,
          type: "FOLLOW",
        },
      }),
    ]);

    return NextResponse.json({ message: "Follow successful" }, { status: 201 });
  } catch (error) {
    console.error("Error following user:", error);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params;

  const { userId } = params;

  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    await prisma.$transaction([
      prisma.follow.deleteMany({
        where: {
          followerId: loggedInUser.id,
          followingId: userId,
        },
      }),
      prisma.notification.deleteMany({
        where: {
          issuerId: loggedInUser.id,
          recipientId: userId,
          type: "FOLLOW",
        },
      }),
    ]);

    return NextResponse.json({ message: "Unfollow successful" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return serverError();
  }
}
