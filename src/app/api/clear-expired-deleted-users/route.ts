import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";

export async function POST() {
  try {
    const gracePeriod = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
    const cutoffDate = new Date(Date.now() - gracePeriod);

    // Find users who were deleted more than 90 days ago
    const expiredDeletedUsers = await prisma.user.findMany({
      where: {
        deletedAt: {
          lt: cutoffDate, // Less than cutoff date (deleted more than 90 days ago)
        },
      },
      select: {
        id: true,
        username: true,
        deletedAt: true,
      },
    });

    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.log(`Found ${expiredDeletedUsers.length} users to permanently delete`);
    }

    let deletedCount = 0;
    let streamChatDeletedCount = 0;

    for (const user of expiredDeletedUsers) {
      try {
        // Permanently delete from StreamChat
        try {
          await streamServerClient.deleteUser(user.id, {
            hard_delete: true,
          });
          streamChatDeletedCount++;
          if (isDev) {
            console.log(`Deleted user ${user.username} from StreamChat`);
          }
        } catch (streamError) {
          console.error(`Failed to delete user ${user.username} from StreamChat:`, streamError);
        }

        // Permanently delete from database
        await prisma.user.delete({
          where: { id: user.id },
        });
        deletedCount++;
        if (isDev) {
          console.log(`Permanently deleted user ${user.username} from database`);
        }

      } catch (error) {
        console.error(`Error deleting user ${user.username}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${deletedCount} users from database and ${streamChatDeletedCount} from StreamChat`,
      deletedCount,
      streamChatDeletedCount,
    });

  } catch (error) {
    console.error("Error in clear-expired-deleted-users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 