import { validateRequestWithCookieMutation } from "@/auth";
import { unauthorized, serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function POST(
  // req is unused, consider removing if not needed for future logic
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

    const { groupId } = params;

    const groupMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
    });

    if (!groupMember) {
      return NextResponse.json(
        { error: "You are not a member of this group." },
        { status: 400 },
      );
    }

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

    await prisma.groupMember.delete({
      where: { userId_groupId: { userId: user.id, groupId } },
    });

    return NextResponse.json({ message: "Successfully left group" });
  } catch (error) {
    console.error("Error leaving group:", error);
    return serverError(); // Use NextResponse
  }
}
