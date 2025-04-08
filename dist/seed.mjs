const { prisma, // Use shared prisma instance
streamChatClient, // Use shared stream client instance
cypressEnv, // Use shared cypress env data
faker, // Use shared faker instance
generateIdFromEntropySize, // Use shared ID generator
passwordHash, // Use shared hash function
// Import other helpers if needed: random, weightedRandom, etc.
accountDataGenerator, // Example: if createUsers still uses it
GroupRole, // Enums if needed
NotificationType, } = await import("./seedUtils.mjs");
// Import the modularized deletion functions
import { deleteTestUsers, deleteTestUsersFromStreamChat, } from "./seedDeletion.mjs";
// Import the modularized seeding functions
import { seedUsers } from "./seedModules/authTeam/users.mjs";
import { seedGroups } from "./seedModules/groupsTeam/groups.mjs";
import { seedGroupMembers } from "./seedModules/groupsTeam/groupMembers.mjs";
import { seedPublicPosts } from "./seedModules/socialTeam/posts.mjs";
import { seedPublicComments } from "./seedModules/socialTeam/comments.mjs";
import { seedEvents } from "./seedModules/eventsTeam/events.mjs";
import { seedEventAttendees } from "./seedModules/eventsTeam/eventAttendees.mjs";
import { seedFollows } from "./seedModules/socialTeam/follows.mjs";
import { seedGroupPosts } from "./seedModules/groupsTeam/groupPosts.mjs";
import { seedLikesDislikes } from "./seedModules/socialTeam/likesDislikes.mjs";
import { seedBookmarks } from "./seedModules/socialTeam/bookmarks.mjs";
import { seedMedia } from "./seedModules/mediaTeam/media.mjs";
import { seedGroupComments } from "./seedModules/groupsTeam/groupComments.mjs";
import { seedNotifications, } from "./seedModules/notificationsTeam/notifications.mjs";
async function main() {
    // Deletion
    const deletedUserIds = await deleteTestUsers(prisma);
    await deleteTestUsersFromStreamChat(streamChatClient, deletedUserIds);
    console.log("Start seeding...");
    // Seeding
    const createdUsers = await seedUsers(prisma, streamChatClient, passwordHash);
    const createdGroups = await seedGroups(prisma, createdUsers);
    const createdGroupMembers = await seedGroupMembers(prisma, createdUsers, createdGroups);
    const createdPublicPosts = await seedPublicPosts(prisma, createdUsers);
    const createdPublicComments = await seedPublicComments(prisma, createdUsers, createdPublicPosts);
    const createdEvents = await seedEvents(prisma, createdUsers);
    const createdAttendees = await seedEventAttendees(prisma, createdUsers, createdEvents);
    const createdFollowers = await seedFollows(prisma, createdUsers);
    // --- Newly Added/Ordered Steps ---
    const createdGroupPosts = await seedGroupPosts(prisma, createdGroups, createdGroupMembers);
    // Combine posts
    const allPosts = [...createdPublicPosts, ...createdGroupPosts];
    const { createdLikes, createdDislikes } = await seedLikesDislikes(prisma, createdUsers, allPosts);
    await seedBookmarks(prisma, createdUsers, allPosts);
    await seedMedia(prisma, allPosts);
    const createdGroupComments = await seedGroupComments(prisma, createdGroupPosts, createdGroupMembers, createdUsers);
    // Combine comments
    const allComments = [
        ...createdPublicComments,
        ...createdGroupComments,
    ];
    // Notifications (last step, needs most data)
    await seedNotifications(prisma, allPosts, allComments, createdLikes, createdDislikes, createdFollowers, createdEvents, createdAttendees);
    // Update final log message
    console.log("Seeding finished: All modules executed.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    // Use the imported prisma client instance to disconnect
    await prisma.$disconnect();
    console.log("end of seeding, Prisma client disconnected.");
});
