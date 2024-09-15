import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;

    // Check if the user is a member
    const groupMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
    });

    if (!groupMember) {
      return NextResponse.json(
        { error: "You are not a member of this group." },
        { status: 400 },
      );
    }

    // Prevent the owner from leaving the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (group?.ownerId === user.id) {
      return NextResponse.json(
        {
          error:
            "Group owners cannot leave the group. Consider deleting the group.",
        },
        { status: 403 },
      );
    }

    // Remove the user from the group
    await prisma.groupMember.delete({
      where: { userId_groupId: { userId: user.id, groupId } },
    });

    return NextResponse.json({ message: "You have left the group." });
  } catch (error) {
    console.error("Error leaving group:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
