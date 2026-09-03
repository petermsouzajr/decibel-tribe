import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { validateRequest } from "@/auth";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params;

  const { userId } = params;

  try {
    const { user } = await validateRequest();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId || userId === user.id)
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });

    await prisma.block.create({
      data: { blockerId: user.id, blockedId: userId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    // Already blocked is the desired end state, so stay idempotent — but only
    // for that. This previously swallowed every error and reported success, so
    // a database failure looked like a successful block.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ success: true });
    }
    console.error("Error blocking user:", error);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params;

  const { userId } = params;

  try {
    const { user } = await validateRequest();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId || userId === user.id)
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });

    await prisma.block.delete({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    // Not blocked in the first place is also the desired end state.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ success: true });
    }
    console.error("Error unblocking user:", error);
    return serverError();
  }
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params;

  const { userId } = params;

  try {
    const { user } = await validateRequest();
    if (!user || user.id !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const blocks = await prisma.block.findMany({
      where: { blockerId: user.id },
      select: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ items: blocks.map((b) => b.blocked) });
  } catch (e) {
    return serverError();
  }
}
