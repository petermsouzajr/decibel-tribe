import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ groupId: string }> },
) {
  const params = await props.params;
  try {
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: group.id,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this group." },
        { status: 403 },
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ groupId: string }> },
) {
  const params = await props.params;
  try {
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. Only the group owner can delete this group." },
        { status: 403 },
      );
    }

    await prisma.group.delete({
      where: { id: params.groupId },
    });

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return serverError();
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ groupId: string }> },
) {
  const params = await props.params;
  try {
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Original route logic
    const groupId = params.groupId;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: group.id,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this group." },
        { status: 403 },
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    return serverError();
  }
}
