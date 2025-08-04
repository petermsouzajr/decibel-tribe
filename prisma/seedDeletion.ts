import { PrismaClient } from "@prisma/client";
import { StreamChat } from "stream-chat";
import {
  cypressEnv,
  prisma as sharedPrisma,
  streamChatClient as sharedStreamChatClient,
} from "./seedUtils.js"; // Add .js extension

const prisma = new PrismaClient();

// --- DB Deletion ---
// Function now accepts prisma client as an argument
export async function deleteTestUsers(prismaClient: any): Promise<string[]> {
  if (!prismaClient) {
    console.error("Prisma client is not available for deleteTestUsers.");
    return [];
  }
  console.log("Deleting testUsers and data from Database...");

  // Get the unique test domain
  const testDomain = cypressEnv.testUserEmailDomain;
  if (!testDomain) {
    console.error(
      "testUserEmailDomain not found in cypress.env.json. Cannot delete by domain.",
    );
    return [];
  }

  let userIds: string[] = [];
  try {
    // Find users whose email ends with the test domain
    const usersToDelete = await prismaClient.user.findMany({
      where: {
        email: {
          endsWith: testDomain,
        },
      },
      select: {
        id: true,
      },
    });

    userIds = usersToDelete.map((user: { id: string }) => user.id);

    if (userIds.length === 0) {
      console.log(
        `...No matching test users found in DB with domain ${testDomain} to delete.`,
      );
      return [];
    }

    // Delete related data first using the passed prismaClient
    await prismaClient.event.deleteMany({
      where: { createdById: { in: userIds } },
    });
    await prismaClient.post.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prismaClient.comment.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prismaClient.like.deleteMany({ where: { userId: { in: userIds } } });
    await prismaClient.dislike.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prismaClient.bookmark.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prismaClient.groupMember.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prismaClient.eventAttendee.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prismaClient.notification.deleteMany({
      where: {
        OR: [{ recipientId: { in: userIds } }, { issuerId: { in: userIds } }],
      },
    });
    await prismaClient.follow.deleteMany({
      where: {
        OR: [{ followerId: { in: userIds } }, { followingId: { in: userIds } }],
      },
    });
    // Delete the users themselves last
    await prismaClient.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });

    console.log(
      `...${userIds.length} test users (domain: ${testDomain}) and related data deleted successfully from DB!`,
    );
  } catch (error) {
    console.error("Error deleting test users from DB by domain:", error);
  } finally {
    // Disconnect is handled in the main script
  }
  return userIds;
}

// --- StreamChat Deletion ---
// Function now accepts stream client as an argument
export async function deleteTestUsersFromStreamChat(
  streamClient: any,
  testUserIds: string[],
) {
  // Use the passed streamClient
  if (!streamClient) {
    console.warn(
      "Stream Chat client is not available. Skipping Stream Chat user deletion.",
    );
    return;
  }

  // Remove local check for keys, assume streamClient is null if keys were missing in seedUtils

  console.log("Deleting testUsers from StreamChat...");
  if (!testUserIds || testUserIds.length === 0) {
    console.log("...No test user IDs provided for StreamChat deletion.");
    return;
  }

  try {
    // Use the passed streamClient
    const streamUsers = await streamClient.queryUsers({
      id: { $in: testUserIds },
    });

    if (streamUsers.users.length === 0) {
      console.log("...No matching test users found in StreamChat to delete.");
      return;
    }

    console.log(
      `...Found ${streamUsers.users.length} test users in StreamChat to delete.`,
    );

    // Delete test users from StreamChat using the passed streamClient
    let deletedCount = 0;
    for (const user of streamUsers.users) {
      try {
        await streamClient.deleteUser(user.id, {
          hardDelete: true,
        });
        console.log(`--- Deleted test user from StreamChat: ${user.id}`);
        deletedCount++;
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            `--- Failed to delete test user ${user.id} from StreamChat:`,
            error.message,
          );
        } else {
          console.error(
            `--- Failed to delete test user ${user.id} from StreamChat:`,
            error,
          );
        }
      }
    }
    console.log(
      `...Finished deleting ${deletedCount} test users from StreamChat.`,
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error during StreamChat test user deletion query:",
        error.message,
      );
    } else {
      console.error("Error during StreamChat test user deletion query:", error);
    }
  }
}
