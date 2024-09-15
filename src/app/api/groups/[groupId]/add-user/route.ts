// src/app/api/groups/[groupId]/add-user/route.ts

import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;

    // Parse the request body
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 },
      );
    }

    // Check if the requester is the group owner or an admin
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { owner: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    if (group.ownerId !== user.id) {
      // Optionally, implement admin roles
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // Check if the user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of the group." },
        { status: 400 },
      );
    }

    // Add the user to the group
    await prisma.groupMember.create({
      data: {
        userId,
        groupId,
        acceptedInvite: false,
      },
    });

    return NextResponse.json({
      message: "User added to the group successfully.",
    });
  } catch (error) {
    console.error("Error adding user to group:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
