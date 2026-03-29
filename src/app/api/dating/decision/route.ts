import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import streamServerClient from "@/lib/stream";
import { NotificationType } from "@prisma/client";

// Rate limiting: Track likes per hour
const likeCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, isLike: boolean): boolean {
  if (!isLike) return true; // Unlimited dislikes

  const now = Date.now();
  const userLimit = likeCounts.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // Reset or initialize
    likeCounts.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 hour
    return true;
  }

  if (userLimit.count >= 100) {
    return false; // Rate limit exceeded
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user status — email verification is enforced at the page level (redirect to /login).
    // Here we only check isDatingActive.
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isDatingActive: true },
    });

    if (!currentUser?.isDatingActive) {
      return NextResponse.json(
        { error: "Dating feature not activated" },
        { status: 403 }
      );
    }

    const { targetUserId, decision, message } = await request.json();

    if (!targetUserId || !decision) {
      return NextResponse.json(
        { error: "targetUserId and decision are required" },
        { status: 400 }
      );
    }

    if (decision !== "LIKE" && decision !== "DISLIKE") {
      return NextResponse.json(
        { error: "decision must be 'LIKE' or 'DISLIKE'" },
        { status: 400 }
      );
    }

    // No email-verification guard here — page-level redirect handles that.
    // All users who reach this API are email-verified by definition.

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot swipe on yourself" },
        { status: 400 }
      );
    }

    // Check rate limiting for likes
    if (decision === "LIKE" && !checkRateLimit(user.id, true)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 100 likes per hour." },
        { status: 429 }
      );
    }

    // Check if swipe already exists
    const existingSwipe = await prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: user.id,
          toUserId: targetUserId,
        },
      },
    });

    if (existingSwipe) {
      return NextResponse.json(
        { error: "Already swiped on this user" },
        { status: 400 }
      );
    }

    // Create swipe record
    const swipe = await prisma.swipe.create({
      data: {
        id: crypto.randomUUID(),
        fromUserId: user.id,
        toUserId: targetUserId,
        direction: decision,
        message: message || null, // Store message if provided with like
        createdAt: new Date(),
      },
    });

    let isMatch = false;
    let matchId: string | null = null;

    // If it's a LIKE, check for mutual like
    if (decision === "LIKE") {
      const reciprocalSwipe = await prisma.swipe.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: targetUserId,
            toUserId: user.id,
          },
        },
      });

      if (reciprocalSwipe && reciprocalSwipe.direction === "LIKE") {
        // Mutual like! Create match
        const user1Id = user.id < targetUserId ? user.id : targetUserId;
        const user2Id = user.id < targetUserId ? targetUserId : user.id;
        const match = await prisma.match.create({
          data: {
            id: crypto.randomUUID(),
            user1Id,
            user2Id,
            createdAt: new Date(),
          },
        });
        isMatch = true;
        matchId = match.id;

        // ASYNC: Handle Stream Chat and notifications in background (don't block response)
        // This improves perceived performance - match response returns immediately
        Promise.all([
          // Create Stream Chat channel asynchronously
          (async () => {
            try {
              const channelId = `dating-${match.id}`;
              const channel = streamServerClient.channel("messaging", channelId, {
                members: [user1Id, user2Id],
                name: undefined, // 1-on-1 chat, no name needed
              });
              await channel.create();
            } catch (streamError) {
              console.error("Error creating Stream Chat channel:", streamError);
              // Don't fail match creation if Stream Chat fails - can be created lazily on first message
            }
          })(),
          // Create notifications asynchronously
          (async () => {
            try {
              // Fetch user display names for personalized notifications
              const [currentUserData, targetUserData] = await Promise.all([
                prisma.user.findUnique({
                  where: { id: user.id },
                  select: { displayName: true },
                }),
                prisma.user.findUnique({
                  where: { id: targetUserId },
                  select: { displayName: true },
                }),
              ]);

              await Promise.all([
                prisma.notification.create({
                  data: {
                    id: crypto.randomUUID(),
                    recipientId: user.id,
                    issuerId: targetUserId,
                    type: NotificationType.MATCH,
                    matchId: match.id,
                    read: false,
                    createdAt: new Date(),
                  },
                }),
                prisma.notification.create({
                  data: {
                    id: crypto.randomUUID(),
                    recipientId: targetUserId,
                    issuerId: user.id,
                    type: NotificationType.MATCH,
                    matchId: match.id,
                    read: false,
                    createdAt: new Date(),
                  },
                }),
              ]);
            } catch (notifError) {
              console.error("Error creating match notifications:", notifError);
              // Non-critical - notifications can be retried later
            }
          })(),
        ]).catch((error) => {
          // Log but don't block response
          console.error("Error in async match setup:", error);
        });
      }
    }

    // If message was provided with like, store it for later (when match occurs)
    // For now, we'll store it in a separate table or add to swipe model
    // This is a placeholder - you may want to add a message field to swipes

    return NextResponse.json({
      success: true,
      isMatch,
      matchId,
      swipeId: swipe.id,
    });
  } catch (error: any) {
    console.error("Error recording decision:", error);
    
    // Handle unique constraint violation (already swiped)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Already swiped on this user" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

