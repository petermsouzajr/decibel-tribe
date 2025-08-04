// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function POST(
  req: NextRequest, // req is unused, consider removing if not needed for future logic
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
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
