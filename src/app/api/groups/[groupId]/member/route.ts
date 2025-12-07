// import { validateRequest } from "@/auth";
import { lucia } from "@/auth"; // Import lucia
import { cookies } from "next/headers"; // Import cookies
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function GET(
  // req is unused, consider removing if not needed for future logic
  req: NextRequest,
  props: { params: Promise<{ groupId: string }> }
) {
  const params = await props.params;
  try {
    // Direct session validation
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionId);

    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
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
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
