import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { cursorArgs, paginate } from "@/lib/api/pagination";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Direct session validation
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    // --- End direct session validation

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageSize = 10;
    const cursor = req.nextUrl.searchParams.get("cursor");

    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId: user.id, acceptedInvite: true },
      select: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      ...cursorArgs(
        cursor
          ? { userId_groupId: { userId: user.id, groupId: cursor } }
          : undefined,
        pageSize,
      ),
    });

    const { items: groups, nextCursor } = paginate(
      groupMemberships.map((membership) => membership.group),
      pageSize,
    );

    return NextResponse.json({ groups, nextCursor });
  } catch (error) {
    console.error("Error fetching user's groups:", error);
    return serverError();
  }
}
