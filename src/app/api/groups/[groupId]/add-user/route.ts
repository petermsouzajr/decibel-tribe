import { validateRequestWithCookieMutation } from "@/auth";
import { forbidden, serverError, unauthorized } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function POST(
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

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 },
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { owner: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    if (group.ownerId !== user.id) {
      return forbidden();
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of the group." },
        { status: 400 },
      );
    }

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
    return serverError();
  }
}
