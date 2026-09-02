import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { requireAdmin } from "@/lib/admin";
import { ReportStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, targetId, reason, description } = body || {};

    if (!type || !targetId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Rate limit: max 5 reports/day per user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyCount = await (prisma as any).report.count({
      where: { reporterId: user.id, createdAt: { gte: today } },
    });
    if (dailyCount >= 5) {
      return NextResponse.json(
        { error: "Report limit reached for today" },
        { status: 429 },
      );
    }

    // Cooldown: 1 minute between any two reports from the same user
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const lastRecentReport = await (prisma as any).report.findFirst({
      where: { reporterId: user.id, createdAt: { gte: oneMinuteAgo } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (lastRecentReport) {
      const secondsSince = Math.floor(
        (Date.now() - new Date(lastRecentReport.createdAt).getTime()) / 1000,
      );
      const waitSeconds = Math.max(0, 60 - secondsSince);
      return NextResponse.json(
        {
          error: `Please wait ${waitSeconds}s before submitting another report.`,
        },
        { status: 429 },
      );
    }

    const data: any = {
      reporterId: user.id,
      reason,
      description: description ?? null,
    };

    switch (type) {
      case "post":
        data.postId = targetId;
        break;
      case "profile":
        data.reportedId = targetId;
        break;
      case "comment":
        data.commentId = targetId;
        break;
      case "group":
        data.groupId = targetId;
        break;
      case "event":
        data.eventId = targetId;
        break;
      case "message":
        data.messageId = targetId; // Message table not yet modeled
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Ensure the target exists to avoid FK errors
    try {
      switch (type) {
        case "post": {
          const exists = await (prisma as any).post.findUnique({
            where: { id: targetId },
            select: { id: true },
          });
          if (!exists)
            return NextResponse.json(
              { error: "Post not found" },
              { status: 404 },
            );
          break;
        }
        case "comment": {
          const exists = await (prisma as any).comment.findUnique({
            where: { id: targetId },
            select: { id: true },
          });
          if (!exists)
            return NextResponse.json(
              { error: "Comment not found" },
              { status: 404 },
            );
          break;
        }
        case "profile": {
          const exists = await (prisma as any).user.findUnique({
            where: { id: targetId },
            select: { id: true },
          });
          if (!exists)
            return NextResponse.json(
              { error: "User not found" },
              { status: 404 },
            );
          break;
        }
        case "group": {
          const exists = await (prisma as any).group.findUnique({
            where: { id: targetId },
            select: { id: true },
          });
          if (!exists)
            return NextResponse.json(
              { error: "Group not found" },
              { status: 404 },
            );
          break;
        }
        case "event": {
          const exists = await (prisma as any).event.findUnique({
            where: { id: targetId },
            select: { id: true },
          });
          if (!exists)
            return NextResponse.json(
              { error: "Event not found" },
              { status: 404 },
            );
          break;
        }
        case "message":
          // message not modeled; skip existence check
          break;
      }
    } catch (e) {
      console.error("Error checking target existence for report:", e);
      return NextResponse.json(
        { error: "Failed to validate target" },
        { status: 500 },
      );
    }

    // Duplicate detection: same reporter + same target already reported and still open
    const duplicateWhere: any = { reporterId: user.id, OR: [] };
    if (data.postId) duplicateWhere.OR.push({ postId: data.postId });
    if (data.commentId) duplicateWhere.OR.push({ commentId: data.commentId });
    if (data.reportedId)
      duplicateWhere.OR.push({ reportedId: data.reportedId });
    if (data.groupId) duplicateWhere.OR.push({ groupId: data.groupId });
    if (data.eventId) duplicateWhere.OR.push({ eventId: data.eventId });
    if (data.messageId) duplicateWhere.OR.push({ messageId: data.messageId });

    // If none pushed, it's invalid (should not happen due to switch above)
    if (duplicateWhere.OR.length > 0) {
      duplicateWhere.status = {
        in: [ReportStatus.PENDING, ReportStatus.INVESTIGATING],
      } as any;
      try {
        const existing = await (prisma as any).report.findFirst({
          where: duplicateWhere,
          select: { id: true, createdAt: true },
        });
        if (existing) {
          return NextResponse.json(
            {
              error:
                "You have already reported this item and it is being reviewed.",
            },
            { status: 409 },
          );
        }
      } catch (e: any) {
        // Fallback for environments where Prisma Client hasn't been regenerated yet
        const msg = String(e?.message || e);
        if (
          msg.includes("Unknown argument`)") ||
          msg.includes("Unknown argument `commentId")
        ) {
          console.warn(
            "Duplicate-check fallback: Prisma Client not updated; continuing without commentId filter",
          );
        } else {
          throw e;
        }
      }
    }

    try {
      const created = await (prisma as any).report.create({ data });
      return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
      const msg = String(e?.message || e);
      // Fallback path for environments where Prisma Client hasn't been regenerated to include commentId
      if (msg.includes("Unknown argument `commentId")) {
        console.warn(
          "Create-report fallback: Prisma Client not updated; inserting with messageId instead of commentId",
        );
        const fallbackData = { ...data };
        if (fallbackData.commentId) {
          fallbackData.messageId = fallbackData.commentId;
          delete fallbackData.commentId;
          // Make it explicit in notes if available
          fallbackData.adminNotes =
            (fallbackData.adminNotes ? fallbackData.adminNotes + " | " : "") +
            "fallback: original commentId stored in messageId";
        }
        const created = await (prisma as any).report.create({
          data: fallbackData,
        });
        return NextResponse.json(created, { status: 201 });
      }
      throw e;
    }
  } catch (error: any) {
    console.error("Error creating report:", error);
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: "Internal server error",
        details: isDev ? String(error?.message ?? error) : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status as any;

    const [items, total] = await Promise.all([
      (prisma as any).report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, username: true } },
          reported: { select: { id: true, username: true } },
          post: { select: { id: true } },
          group: { select: { id: true, name: true } },
          event: { select: { id: true, title: true } },
        },
      }),
      (prisma as any).report.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error listing reports:", error);
    return serverError();
  }
}
