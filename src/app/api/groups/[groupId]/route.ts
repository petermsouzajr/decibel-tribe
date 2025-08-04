import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionId);

    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    // Direct session validation
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionId);

    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    // --- End direct session validation

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    // Direct session validation
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionId);

    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    // --- End direct session validation

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
