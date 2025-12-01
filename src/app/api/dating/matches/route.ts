import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import streamServerClient from "@/lib/stream";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if dating is active (non-verified users can access but won't have matches)
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

    // Get all matches for the current user
    const matches = await prisma.matches.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
      include: {
        users_matches_user1IdTousers: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            user_dating_profile: {
              select: {
                age: true,
                location: true,
              },
            },
            user_photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        users_matches_user2IdTousers: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            user_dating_profile: {
              select: {
                age: true,
                location: true,
              },
            },
            user_photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get last message for each match
    const matchesWithMessages = await Promise.all(
      matches.map(async (match) => {
        const otherUser =
          match.user1Id === user.id
            ? match.users_matches_user2IdTousers
            : match.users_matches_user1IdTousers;

        // Get last message from Stream Chat
        let lastMessage = null;
        let unreadCount = 0;
        try {
          const channelId = `dating-${match.id}`;
          const channel = streamServerClient.channel("messaging", channelId);
          await channel.watch();
          
          const messages = await channel.query({
            messages: { limit: 1 },
          });

          if (messages.messages && messages.messages.length > 0) {
            const latestMessage = messages.messages[0];
            lastMessage = {
              content: latestMessage.text || "",
              createdAt: latestMessage.created_at || new Date(),
              isFromMe: latestMessage.user?.id === user.id,
              read: true, // Stream Chat handles read receipts differently
            };
          }

          // Get unread count from Stream Chat
          const state = channel.state;
          unreadCount = state.unreadCount || 0;
        } catch (error) {
          // Channel might not exist yet - that's okay
          console.log("Stream Chat channel not available yet:", error);
        }

        return {
          matchId: match.id,
          user: {
            id: otherUser.id,
            username: otherUser.username,
            displayName: otherUser.displayName,
            avatarUrl: otherUser.avatarUrl,
            primaryPhotoUrl: otherUser.user_photos[0]?.url || otherUser.avatarUrl,
            age: otherUser.user_dating_profile?.age || null,
            location: otherUser.user_dating_profile?.location || null,
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                isFromMe: lastMessage.isFromMe,
                read: lastMessage.read,
              }
            : null,
          unreadCount,
          matchedAt: match.createdAt,
        };
      })
    );

    return NextResponse.json({ matches: matchesWithMessages });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

