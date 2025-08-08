import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function POST(
  req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId || userId === user.id) return NextResponse.json({ error: "Invalid target" }, { status: 400 });

    await (prisma as any).block.create({
      data: { blockerId: user.id, blockedId: userId },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    // idempotent: ignore duplicate
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId || userId === user.id) return NextResponse.json({ error: "Invalid target" }, { status: 400 });

    await (prisma as any).block.delete({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    // idempotent
    return NextResponse.json({ success: true });
  }
}

export async function GET(req: NextRequest, { params: { userId } }: { params: { userId: string } }) {
  try {
    const { user } = await validateRequest();
    if (!user || user.id !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const blocks = await (prisma as any).block.findMany({
      where: { blockerId: user.id },
      select: { blocked: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ items: blocks.map((b: any) => b.blocked) });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


