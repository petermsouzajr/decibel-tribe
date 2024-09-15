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

    // Find the group member entry
    const groupMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
    });

    if (!groupMember) {
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 },
      );
    }

    if (groupMember.acceptedInvite) {
      return NextResponse.json(
        { error: "You are already a member of this group." },
        { status: 400 },
      );
    }

    // Update acceptedInvite to true
    await prisma.groupMember.update({
      where: { userId_groupId: { userId: user.id, groupId } },
      data: { acceptedInvite: true },
    });

    return NextResponse.json({
      message: "Invitation accepted. You are now a member of the group.",
    });
  } catch (error) {
    console.error("Error accepting group invite:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
