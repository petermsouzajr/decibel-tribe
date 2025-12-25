const {
  prisma, // Use shared prisma instance
  streamChatClient, // Use shared stream client instance
  cypressEnv, // Use shared cypress env data
  faker, // Use shared faker instance
  generateIdFromEntropySize, // Use shared ID generator
  passwordHash, // Use shared hash function
  // Import other helpers if needed: random, weightedRandom, etc.
  accountDataGenerator, // Example: if createUsers still uses it
  GroupRole, // Enums if needed
  NotificationType,
} = await import("./seedUtils.js");

// Import the modularized deletion functions
import {
  deleteTestUsers,
  deleteTestUsersFromStreamChat,
} from "./seedDeletion.js";

// Import the modularized seeding functions
import { seedUsers } from "./seedModules/authTeam/users.js";
import { seedGroups } from "./seedModules/groupsTeam/groups.js";
import { seedGroupMembers } from "./seedModules/groupsTeam/groupMembers.js";
import { seedPublicPosts } from "./seedModules/socialTeam/posts.js";
import { seedPublicComments } from "./seedModules/socialTeam/comments.js";
import { seedEvents } from "./seedModules/eventsTeam/events.js";
import { seedEventAttendees } from "./seedModules/eventsTeam/eventAttendees.js";
import { seedFollows } from "./seedModules/socialTeam/follows.js";
import { seedGroupPosts } from "./seedModules/groupsTeam/groupPosts.js";
import { seedLikesDislikes } from "./seedModules/socialTeam/likesDislikes.js";
import { seedBookmarks } from "./seedModules/socialTeam/bookmarks.js";
import { seedMedia } from "./seedModules/mediaTeam/media.js";
import { seedGroupComments } from "./seedModules/groupsTeam/groupComments.js";
import {
  seedNotifications,
  type CommentInput,
} from "./seedModules/notificationsTeam/notifications.js";
import { seedReports } from "./seedModules/adminTeam/reports.js";
import { seedDatingProfiles } from "./seedModules/datingTeam/datingProfiles.js";
import { seedCommentLikes } from "./seedModules/socialTeam/commentLikes.js";
import { seedBlocks } from "./seedModules/socialTeam/blocks.js";
import { seedUserInstruments } from "./seedModules/authTeam/userInstruments.js";
import { seedUserSkills } from "./seedModules/authTeam/userSkills.js";
import { seedIdentityVerification } from "./seedModules/datingTeam/identityVerification.js";
import { seedMatches } from "./seedModules/datingTeam/matches.js";

async function main() {
  // --- Deletion (outside transaction) ---
  // It's often safer to delete outside the main transaction
  // to avoid holding locks for too long or transaction size limits.
  console.log("Initiating deletion phase..."); // Add logging
  const deletedUserIds = await deleteTestUsers(prisma);
  await deleteTestUsersFromStreamChat(streamChatClient, deletedUserIds);
  console.log("Deletion phase completed.");

  console.log("Start seeding...");

  // --- Seeding (inside transaction) ---
  try {
    await prisma.$transaction(
      async (tx) => {
        console.log("Starting Prisma transaction for seeding...");

        // Pass the transaction client 'tx' to each seeding function
        const createdUsers = await seedUsers(
          tx as any,
          streamChatClient,
          passwordHash,
        );
        if (createdUsers.length === 0)
          throw new Error("User seeding failed, aborting transaction.");

        const createdGroups = await seedGroups(tx as any, createdUsers);
        const createdGroupMembers = await seedGroupMembers(
          tx as any, // Pass tx
          createdUsers,
          createdGroups,
        );
        if (createdGroupMembers.length === 0 && createdGroups.length > 0) {
          // Allow 0 members if 0 groups were created, otherwise warn/error
          console.warn(
            "Warning: Group member seeding resulted in 0 members despite groups existing.",
          );
          // Consider throwing an error if members are essential
          // throw new Error("Group member seeding failed.");
        }

        const createdPublicPosts = await seedPublicPosts(
          tx as any,
          createdUsers,
        );
        console.log(`Created ${createdPublicPosts.length} public posts`);
        
        const createdPublicComments = await seedPublicComments(
          tx as any,
          createdUsers,
          createdPublicPosts,
        );
        console.log(`Created ${createdPublicComments.length} public comments`);
        
        const createdEvents = await seedEvents(tx as any, createdUsers);
        console.log(`Created ${createdEvents.length} events`);
        
        const createdAttendees = await seedEventAttendees(
          tx as any,
          createdUsers,
          createdEvents,
        );
        console.log(`Created ${createdAttendees.length} event attendees`);
        
        const createdFollowers = await seedFollows(tx as any, createdUsers);
        console.log(`Created ${createdFollowers.length} follows`);

        const createdGroupPosts = await seedGroupPosts(
          tx as any,
          createdGroups,
          createdGroupMembers,
        );
        console.log(`Created ${createdGroupPosts.length} group posts`);

        const allPosts = [...createdPublicPosts, ...createdGroupPosts];
        console.log(`Total posts for likes/dislikes: ${allPosts.length}`);

        const { createdLikes, createdDislikes } = await seedLikesDislikes(
          tx as any,
          createdUsers,
          allPosts,
        );
        console.log(`Created ${createdLikes.length} likes and ${createdDislikes.length} dislikes`);

        await seedBookmarks(tx as any, createdUsers, allPosts);
        await seedMedia(tx as any, allPosts);

        const createdGroupComments = await seedGroupComments(
          tx as any,
          createdGroupPosts,
          createdGroupMembers,
          createdUsers, // Pass createdUsers here too
        );

        const allComments: CommentInput[] = [
          ...createdPublicComments,
          ...createdGroupComments,
        ];

        // Seed comment likes
        await seedCommentLikes(tx as any, createdUsers, allComments);

        await seedNotifications(
          tx as any,
          allPosts,
          allComments,
          createdLikes,
          createdDislikes,
          createdFollowers,
          createdEvents,
          createdAttendees,
        );
        console.log(`Notifications seeding completed`);

        // --- AdminTeam: seed reports ---
        const adminUsers = await tx.user.findMany({
          where: { isAdmin: true },
          select: { id: true },
        });
        const allUsers = await tx.user.findMany({ select: { id: true } });
        const allPostIds = (await tx.post.findMany({ select: { id: true } })).map((p) => p.id);
        const allGroupIds = (await tx.group.findMany({ select: { id: true } })).map((g) => g.id);
        const allEventIds = (await tx.event.findMany({ select: { id: true } })).map((e) => e.id);

        await seedReports(tx as any, {
          adminUserIds: adminUsers.map((u) => u.id),
          regularUserIds: allUsers.map((u) => u.id),
          postIds: allPostIds,
          groupIds: allGroupIds,
          eventIds: allEventIds,
        });

        // Seed blocks
        await seedBlocks(tx as any, createdUsers);

        // Seed user instruments and skills
        await seedUserInstruments(tx as any, createdUsers);
        await seedUserSkills(tx as any, createdUsers);

        // --- DatingTeam: seed dating profiles ---
        const datingUsers = await seedDatingProfiles(tx as any, streamChatClient, passwordHash);
        
        // Get all dating active users for matches and identity verification
        const allDatingActiveUsers = await tx.user.findMany({
          where: { isDatingActive: true },
          select: { id: true, isDatingActive: true },
        });
        
        // Seed additional matches and identity verification
        await seedMatches(tx as any, allDatingActiveUsers);
        await seedIdentityVerification(tx as any, allDatingActiveUsers);

        console.log("Prisma transaction committed successfully.");
        
        // Add dating users to StreamChat AFTER transaction (non-blocking)
        if (streamChatClient && datingUsers.length > 0) {
          console.log("Adding dating users to StreamChat (outside transaction)...");
          const streamChatUsers = datingUsers.map((u) => ({
            id: u.userId,
            name: u.username,
            email: `${u.username}@${cypressEnv.testUserEmailDomain}`,
          }));
          try {
            const batchSize = 100;
            for (let i = 0; i < streamChatUsers.length; i += batchSize) {
              const batch = streamChatUsers.slice(i, i + batchSize);
              await streamChatClient.upsertUsers(batch);
            }
            console.log(`...${streamChatUsers.length} dating users upserted to StreamChat.`);
          } catch (error) {
            console.error("Failed to add dating users to StreamChat:", (error as Error).message);
          }
        }
      },
      {
        timeout: 900000, // 15 minutes (seed can be very large on prod-like DBs)
      },
    ); // End of prisma.$transaction

    console.log("Seeding finished: All modules executed successfully.");
  } catch (error) {
    console.error("Error during seeding transaction:", error);
    // process.exit(1) will be handled by the main catch block
    throw error; // Re-throw error to be caught by the main catch block
  }
}

main()
  .catch((e) => {
    console.error("Seeding script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect(); // Disconnect the global client
    console.log("end of seeding, Prisma client disconnected.");
  });
