import { validateRequestWithCookieMutation } from "@/auth";
import { serverError, unauthorized } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function GET(
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
      select: {
        id: true,
        userId: true,
        groupId: true,
        role: true,
        acceptedInvite: true,
        joinedAt: true,
      },
    });

    return NextResponse.json(groupMember);
  } catch (error) {
    console.error("Error fetching group member:", error);
    return serverError();
  }
}
