import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest, props: { params: Promise<{ matchId: string }> }) {
  const params = await props.params;
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if dating is active
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isVerified: true, isDatingActive: true },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    const { matchId } = params;

    // Verify user is part of this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.user1Id !== user.id && match.user2Id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this match" },
        { status: 403 }
      );
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { matchId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const hasNextPage = messages.length > limit;
    const messageList = hasNextPage ? messages.slice(0, limit) : messages;
    const nextCursor = hasNextPage ? messageList[messageList.length - 1].id : null;

    // Mark messages as read (only messages not from current user)
    await prisma.message.updateMany({
      where: {
        matchId,
        senderId: { not: user.id },
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({
      messages: messageList.reverse().map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        sender: {
          id: msg.sender.id,
          username: msg.sender.username,
          displayName: msg.sender.displayName,
          avatarUrl: msg.sender.avatarUrl,
        },
        read: msg.read,
        createdAt: msg.createdAt,
        isFromMe: msg.senderId === user.id,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ matchId: string }> }) {
  const params = await props.params;
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if dating is active
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isVerified: true, isDatingActive: true },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    const { matchId } = params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Verify user is part of this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.user1Id !== user.id && match.user2Id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this match" },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        matchId,
        senderId: user.id,
        content: content.trim(),
        read: false,
        createdAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        displayName: message.sender.displayName,
        avatarUrl: message.sender.avatarUrl,
      },
      read: message.read,
      createdAt: message.createdAt,
      isFromMe: true,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

