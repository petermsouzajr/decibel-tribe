import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { requireAdmin } from "@/lib/admin";
import { Prisma, ReportStatus } from "@prisma/client";

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
    const dailyCount = await prisma.report.count({
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
    const lastRecentReport = await prisma.report.findFirst({
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

    const data: Prisma.ReportUncheckedCreateInput = {
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
          const exists = await prisma.post.findUnique({
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
          const exists = await prisma.comment.findUnique({
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
          const exists = await prisma.user.findUnique({
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
          const exists = await prisma.group.findUnique({
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
          const exists = await prisma.event.findUnique({
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
    const targetFilters: Prisma.ReportWhereInput[] = [];
    if (data.postId) targetFilters.push({ postId: data.postId });
    if (data.commentId) targetFilters.push({ commentId: data.commentId });
    if (data.reportedId) targetFilters.push({ reportedId: data.reportedId });
    if (data.groupId) targetFilters.push({ groupId: data.groupId });
    if (data.eventId) targetFilters.push({ eventId: data.eventId });
    if (data.messageId) targetFilters.push({ messageId: data.messageId });

    // If none pushed, it's invalid (should not happen due to switch above)
    if (targetFilters.length > 0) {
      const existing = await prisma.report.findFirst({
        where: {
          reporterId: user.id,
          OR: targetFilters,
          status: {
            in: [ReportStatus.PENDING, ReportStatus.INVESTIGATING],
          },
        },
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
    }

    const created = await prisma.report.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: "Internal server error",
        details: isDev
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
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

    const where: Prisma.ReportWhereInput = {};
    if (status) where.status = status as ReportStatus;

    const [items, total] = await Promise.all([
      prisma.report.findMany({
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
      prisma.report.count({ where }),
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
