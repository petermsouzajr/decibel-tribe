import {
  cypressEnv
} from "./chunk-TRJORDRN.js";

// prisma/seedDeletion.ts
async function deleteTestUsers(prismaClient) {
  if (!prismaClient) {
    console.error("Prisma client is not available for deleteTestUsers.");
    return [];
  }
  console.log("Deleting testUsers and data from Database...");
  const testDomain = cypressEnv.testUserEmailDomain;
  if (!testDomain) {
    console.error(
      "testUserEmailDomain not found in cypress.env.json. Cannot delete by domain."
    );
    return [];
  }
  let userIds = [];
  try {
    const usersToDelete = await prismaClient.user.findMany({
      where: {
        email: {
          endsWith: testDomain
        }
      },
      select: {
        id: true
      }
    });
    userIds = usersToDelete.map((user) => user.id);
    if (userIds.length === 0) {
      console.log(
        `...No matching test users found in DB with domain ${testDomain} to delete.`
      );
      return [];
    }
    const postsToDelete = await prismaClient.post.findMany({
      where: { userId: { in: userIds } },
      select: { id: true }
    });
    const postIds = postsToDelete.map((p) => p.id);
    await prismaClient.event.deleteMany({
      where: { createdById: { in: userIds } }
    });
    if (postIds.length > 0) {
      await prismaClient.media.deleteMany({
        where: { postId: { in: postIds } }
      });
    }
    await prismaClient.post.deleteMany({
      where: { userId: { in: userIds } }
    });
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
    const orphanedMediaCount = await prismaClient.media.deleteMany({
      where: {
        postId: null,
        createdAt: {
          lte: oneHourAgo
        }
      }
    });
    if (orphanedMediaCount.count > 0) {
      console.log(`...Deleted ${orphanedMediaCount.count} orphaned media records (postId: null).`);
    }
    await prismaClient.comment.deleteMany({
      where: { userId: { in: userIds } }
    });
    await prismaClient.like.deleteMany({ where: { userId: { in: userIds } } });
    await prismaClient.dislike.deleteMany({
      where: { userId: { in: userIds } }
    });
    await prismaClient.bookmark.deleteMany({
      where: { userId: { in: userIds } }
    });
    await prismaClient.groupMember.deleteMany({
      where: { userId: { in: userIds } }
    });
    await prismaClient.eventAttendee.deleteMany({
      where: { userId: { in: userIds } }
    });
    await prismaClient.notification.deleteMany({
      where: {
        OR: [{ recipientId: { in: userIds } }, { issuerId: { in: userIds } }]
      }
    });
    await prismaClient.follow.deleteMany({
      where: {
        OR: [{ followerId: { in: userIds } }, { followingId: { in: userIds } }]
      }
    });
    await prismaClient.report.deleteMany({
      where: {
        OR: [
          { reporterId: { in: userIds } },
          { reportedId: { in: userIds } },
          { resolvedBy: { in: userIds } }
        ]
      }
    });
    await prismaClient.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });
    console.log(
      `...${userIds.length} test users (domain: ${testDomain}) and related data deleted successfully from DB!`
    );
  } catch (error) {
    console.error("Error deleting test users from DB by domain:", error);
  } finally {
  }
  return userIds;
}
async function deleteTestUsersFromStreamChat(streamClient, testUserIds, testEmailDomain) {
  if (!streamClient) {
    console.warn(
      "Stream Chat client is not available. Skipping Stream Chat user deletion."
    );
    return;
  }
  console.log("Deleting testUsers from StreamChat...");
  const hasIds = Array.isArray(testUserIds) && testUserIds.length > 0;
  const hasDomain = typeof testEmailDomain === "string" && testEmailDomain.length > 0;
  if (!hasIds && !hasDomain) {
    console.log("...No test user IDs (or email domain) provided for StreamChat deletion.");
    return;
  }
  try {
    let streamUsers = { users: [] };
    if (hasIds) {
      streamUsers = await streamClient.queryUsers({
        id: { $in: testUserIds }
      });
    } else {
      const matches = [];
      const pageSize = 100;
      let offset = 0;
      while (offset <= 1e3) {
        const page = await streamClient.queryUsers({}, { id: 1 }, { limit: pageSize, offset });
        const users = Array.isArray(page?.users) ? page.users : [];
        if (users.length === 0) break;
        for (const u of users) {
          const email = u?.email;
          if (typeof email === "string" && hasDomain && email.toLowerCase().endsWith(testEmailDomain.toLowerCase())) {
            matches.push(u);
          }
        }
        offset += users.length;
        if (users.length < pageSize) break;
      }
      streamUsers = { users: matches };
    }
    if (streamUsers.users.length === 0) {
      console.log("...No matching test users found in StreamChat to delete.");
      return;
    }
    console.log(
      `...Found ${streamUsers.users.length} test users in StreamChat to delete.`
    );
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let deletedCount = 0;
    let failedCount = 0;
    for (const user of streamUsers.users) {
      let attempt = 0;
      let deleted = false;
      while (attempt < 5 && !deleted) {
        attempt++;
        try {
          await streamClient.deleteUser(user.id, { hardDelete: true });
          deletedCount++;
          if (deletedCount % 25 === 0) {
            console.log(`--- Deleted ${deletedCount}/${streamUsers.users.length} test users from StreamChat...`);
          }
          deleted = true;
          await sleep(200);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const isRateLimit = message.includes("Too many requests") || message.includes("error code 9") || message.toLowerCase().includes("rate");
          if (isRateLimit && attempt < 5) {
            const backoffMs = Math.min(1e3 * attempt * attempt, 1e4);
            console.warn(
              `--- Rate-limited deleting ${user.id}. Backing off ${backoffMs}ms (attempt ${attempt}/5)`
            );
            await sleep(backoffMs);
            continue;
          }
          failedCount++;
          console.error(`--- Failed to delete StreamChat user ${user.id}:`, message);
          await sleep(250);
          break;
        }
      }
    }
    console.log(
      `...Finished deleting ${deletedCount} test users from StreamChat. Failed: ${failedCount}.`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error during StreamChat test user deletion query:",
        error.message
      );
    } else {
      console.error("Error during StreamChat test user deletion query:", error);
    }
  }
}

// prisma/purgeTestUsers.ts
var { prisma, streamChatClient, cypressEnv: cypressEnv2 } = await import("./seedUtils-3VTZJKVD.js");
async function main() {
  const testDomain = cypressEnv2?.testUserEmailDomain;
  if (!testDomain || typeof testDomain !== "string") {
    throw new Error(
      "Missing cypressEnv.testUserEmailDomain. Set it in cypress.env.json to safely target test users."
    );
  }
  console.log(`Purging test users from DB/StreamChat (domain: ${testDomain})...`);
  const deletedUserIds = await deleteTestUsers(prisma);
  await deleteTestUsersFromStreamChat(streamChatClient, deletedUserIds, testDomain);
  console.log(
    `Done. Deleted ${deletedUserIds.length} test users (domain: ${testDomain}).`
  );
}
main().catch((e) => {
  console.error("Purge script failed:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  console.log("Prisma client disconnected.");
});
