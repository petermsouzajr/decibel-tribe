import { validateRequestWithCookieMutation } from "@/auth";
import { serverError, unauthorized } from "@/lib/api/responses";
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

    await prisma.groupMember.update({
      where: { userId_groupId: { userId: user.id, groupId } },
      data: { acceptedInvite: true },
    });

    return NextResponse.json({
      message: "Invitation accepted. You are now a member of the group.",
    });
  } catch (error) {
    console.error("Error accepting group invite:", error);
    return serverError();
  }
}
