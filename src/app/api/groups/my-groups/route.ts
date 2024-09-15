// src/app/api/groups/my-groups/route.ts

import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

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
      take: pageSize + 1,
      skip: cursor ? 1 : 0,
      ...(cursor && {
        cursor: {
          userId_groupId: {
            userId: user.id,
            groupId: cursor,
          },
        },
      }),
    });

    const groups = groupMemberships.map((membership) => membership.group);

    const hasNextPage = groups.length > pageSize;
    const nextCursor = hasNextPage ? groups[groups.length - 1].id : null;

    if (hasNextPage) groups.pop();

    return NextResponse.json({ groups, nextCursor });
  } catch (error) {
    console.error("Error fetching user's groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
