import {
  accountDataGenerator,
  cypressEnv,
  faker,
  generateIdFromEntropySize
} from "./chunk-6LT2VYDU.js";

// prisma/seedDeletion.ts
import { PrismaClient } from "@prisma/client";
var prisma = new PrismaClient();
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
    await prismaClient.event.deleteMany({
      where: { createdById: { in: userIds } }
    });
    await prismaClient.post.deleteMany({
      where: { userId: { in: userIds } }
    });
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
async function deleteTestUsersFromStreamChat(streamClient, testUserIds) {
  if (!streamClient) {
    console.warn(
      "Stream Chat client is not available. Skipping Stream Chat user deletion."
    );
    return;
  }
  console.log("Deleting testUsers from StreamChat...");
  if (!testUserIds || testUserIds.length === 0) {
    console.log("...No test user IDs provided for StreamChat deletion.");
    return;
  }
  try {
    const streamUsers = await streamClient.queryUsers({
      id: { $in: testUserIds }
    });
    if (streamUsers.users.length === 0) {
      console.log("...No matching test users found in StreamChat to delete.");
      return;
    }
    console.log(
      `...Found ${streamUsers.users.length} test users in StreamChat to delete.`
    );
    let deletedCount = 0;
    for (const user of streamUsers.users) {
      try {
        await streamClient.deleteUser(user.id, {
          hardDelete: true
        });
        console.log(`--- Deleted test user from StreamChat: ${user.id}`);
        deletedCount++;
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            `--- Failed to delete test user ${user.id} from StreamChat:`,
            error.message
          );
        } else {
          console.error(
            `--- Failed to delete test user ${user.id} from StreamChat:`,
            error
          );
        }
      }
    }
    console.log(
      `...Finished deleting ${deletedCount} test users from StreamChat.`
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

// prisma/seedModules/authTeam/users.ts
import { PrismaClient as PrismaClient2 } from "@prisma/client";
var prisma2 = new PrismaClient2();
async function seedUsers(tx, streamClient, hasher) {
  if (!tx) {
    console.error("Prisma client is not available for seedUsers.");
    return [];
  }
  console.log("Seeding users...");
  const usersToCreate = [];
  const allKeys = Object.keys(cypressEnv);
  const userTypeKeys = allKeys.filter((key) => key.endsWith("User"));
  const emailDomain = cypressEnv.testUserEmailDomain;
  const password = cypressEnv.password;
  console.log(
    `Preparing ${userTypeKeys.length} users based on cypress.env.json keys...`
  );
  const hashedPassword = await hasher(password);
  const usernamesToCreate = [];
  for (const key of userTypeKeys) {
    const username = cypressEnv[key];
    if (!username) continue;
    usernamesToCreate.push(username);
    const userId = generateIdFromEntropySize(10);
    const email = `${username.toLowerCase()}${emailDomain}`;
    const isGoogleLoginUser = key === "googleLoginUser";
    const isVerified = !key.toLowerCase().includes("unverified");
    const hasAvatar = !key.toLowerCase().includes("noavatar");
    const isNoBioUser = key.toLowerCase().includes("nobio");
    const googleId = isGoogleLoginUser ? `${faker.string.numeric(10)}${faker.string.alphanumeric(10)}` : null;
    const userPasswordHash = isGoogleLoginUser ? null : hashedPassword;
    let avatarUrl = hasAvatar && Math.random() < 0.8 ? `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}` : null;
    const bio = isNoBioUser ? null : faker.lorem.sentence();
    const createdAt = faker.date.between({
      from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1e3),
      to: /* @__PURE__ */ new Date()
    });
    const userData = {
      id: userId,
      username,
      email,
      displayName: username,
      passwordHash: userPasswordHash,
      isVerified,
      avatarUrl,
      googleId,
      bio,
      createdAt
    };
    usersToCreate.push(userData);
  }
  let createdCount = 0;
  try {
    const createResult = await tx.user.createMany({
      data: usersToCreate,
      skipDuplicates: true
    });
    createdCount = createResult.count;
    console.log(`...${createdCount} users created/skipped in DB.`);
    if (usersToCreate.length > 0 && createdCount === 0) {
      console.warn(
        "Warning: User createMany reported 0 created users, duplicates might exist or DB issue."
      );
    }
    const actualCreatedUsers = await tx.user.findMany({
      where: {
        // Filter based on usernames we intended to create
        username: { in: usernamesToCreate }
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        isVerified: true
        // Select other fields ONLY if strictly needed by downstream modules
      }
    });
    console.log(
      `...Fetched ${actualCreatedUsers.length} actual users from DB.`
    );
    console.log(`Adding ${usersToCreate.length} users to StreamChat...`);
    const streamChatUsers = usersToCreate.map((user) => ({
      id: user.id,
      name: user.displayName,
      image: user.avatarUrl,
      email: user.email
    }));
    if (streamClient) {
      try {
        await streamClient.upsertUsers(streamChatUsers);
        console.log(
          `...${streamChatUsers.length} users upserted to StreamChat.`
        );
      } catch (error) {
        console.error(
          `Failed to add users to StreamChat:`,
          error.message
        );
      }
    } else {
      console.warn(
        "Stream Chat client not available. Skipping Stream Chat user upsert."
      );
    }
    return actualCreatedUsers;
  } catch (error) {
    console.error("Error during user seeding operations:", error);
    return [];
  }
}

// prisma/seedModules/groupsTeam/groups.ts
async function seedGroups(prismaClient, createdUsers) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedGroups.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for group creation. Skipping.");
    return [];
  }
  console.log("Creating groups...");
  const groupsData = [];
  const createdGroupsForReturn = [];
  const eligibleUsers = createdUsers;
  for (const user of eligibleUsers) {
    const groupQuantity = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < groupQuantity; i++) {
      const groupId = generateIdFromEntropySize(10);
      const createdAtDate = faker.date.between({
        from: user.createdAt,
        to: /* @__PURE__ */ new Date()
      });
      const groupInput = {
        id: groupId,
        name: faker.company.name(),
        description: faker.lorem.sentence(),
        ownerId: user.id,
        // Use flat ownerId for CreateManyInput
        createdAt: createdAtDate
      };
      groupsData.push(groupInput);
      createdGroupsForReturn.push({
        id: groupId,
        ownerId: user.id,
        createdAt: createdAtDate
        // Keep createdAt here
      });
    }
  }
  if (groupsData.length === 0) {
    console.log("...No groups generated to create.");
    return [];
  }
  try {
    await prismaClient.group.createMany({
      data: groupsData,
      skipDuplicates: true
    });
    console.log(`...${groupsData.length} groups created!`);
  } catch (error) {
    console.error("Error creating groups in DB:", error);
    return [];
  }
  return createdGroupsForReturn;
}

// prisma/seedModules/groupsTeam/groupMembers.ts
import { GroupRole } from "@prisma/client";
async function seedGroupMembers(prismaClient, createdUsers, createdGroups) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedGroupMembers.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for group member creation. Skipping.");
    return [];
  }
  if (!createdGroups || createdGroups.length === 0) {
    console.log("No groups provided for group member creation. Skipping.");
    return [];
  }
  console.log("Creating group members...");
  const membersData = [];
  const createdMembersForReturn = [];
  const eligibleUsers = createdUsers.filter(
    (u) => !u.username.includes("noGroupMemberships")
  );
  if (eligibleUsers.length === 0) {
    console.log("No eligible users found to create group members.");
    return [];
  }
  for (const group of createdGroups) {
    const ownerUser = eligibleUsers.find((u) => u.id === group.ownerId);
    if (ownerUser) {
      const ownerMemberId = generateIdFromEntropySize(10);
      const ownerJoinedAt = new Date(
        Math.max(ownerUser.createdAt.getTime(), group.createdAt.getTime())
      );
      membersData.push({
        id: ownerMemberId,
        userId: ownerUser.id,
        groupId: group.id,
        role: GroupRole.ADMIN,
        joinedAt: ownerJoinedAt,
        acceptedInvite: true
      });
      createdMembersForReturn.push({
        id: ownerMemberId,
        userId: ownerUser.id,
        groupId: group.id,
        role: GroupRole.ADMIN,
        joinedAt: ownerJoinedAt,
        acceptedInvite: true
      });
    } else {
      if (createdUsers.some((u) => u.id === group.ownerId)) {
        console.warn(
          `Owner ${group.ownerId} for group ${group.id} was ineligible.`
        );
      }
    }
    const memberQuantity = accountDataGenerator("random", 1, 15);
    const potentialMembers = faker.helpers.shuffle(
      eligibleUsers.filter((u) => u.id !== group.ownerId)
    );
    for (let i = 0; i < memberQuantity && i < potentialMembers.length; i++) {
      const memberUser = potentialMembers[i];
      const memberId = generateIdFromEntropySize(10);
      const memberRole = faker.helpers.arrayElement([
        GroupRole.MEMBER,
        GroupRole.ADMIN
      ]);
      const acceptedInvite = faker.datatype.boolean();
      const earliestJoinDate = new Date(
        Math.max(memberUser.createdAt.getTime(), group.createdAt.getTime())
      );
      const joinedAt = faker.date.between({
        from: earliestJoinDate,
        to: /* @__PURE__ */ new Date()
      });
      const memberInput = {
        id: memberId,
        userId: memberUser.id,
        groupId: group.id,
        role: memberRole,
        acceptedInvite,
        joinedAt
      };
      membersData.push(memberInput);
      createdMembersForReturn.push({
        id: memberId,
        userId: memberUser.id,
        groupId: group.id,
        role: memberRole,
        joinedAt,
        acceptedInvite
      });
    }
  }
  if (membersData.length === 0) {
    console.log("...No group memberships generated to create.");
    return [];
  }
  try {
    await prismaClient.groupMember.createMany({
      data: membersData,
      skipDuplicates: true
    });
    console.log(
      `...${membersData.length} potential members across ${createdGroups.length} groups created!`
    );
  } catch (error) {
    console.error("Error creating group members in DB:", error);
    return [];
  }
  return createdMembersForReturn;
}

// prisma/seedModules/socialTeam/posts.ts
async function seedPublicPosts(prismaClient, createdUsers) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedPublicPosts.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for public post creation. Skipping.");
    return [];
  }
  console.log("Creating public posts...");
  const postsData = [];
  const createdPostsForReturn = [];
  const eligibleUsers = createdUsers.filter(
    (user) => user.isVerified && !user.username.includes("noPosts")
  );
  if (eligibleUsers.length === 0) {
    console.log("...No eligible users found to create public posts.");
    return [];
  }
  for (const user of eligibleUsers) {
    const postQuantity = accountDataGenerator("random", 1, 20);
    for (let i = 0; i < postQuantity; i++) {
      const postId = generateIdFromEntropySize(10);
      const createdAtDate = faker.date.between({
        from: new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1e3),
        to: /* @__PURE__ */ new Date()
      });
      const postInput = {
        id: postId,
        content: `public post ${faker.lorem.sentence()}`,
        userId: user.id,
        groupId: null,
        createdAt: createdAtDate
      };
      postsData.push(postInput);
      createdPostsForReturn.push({
        id: postId,
        userId: user.id,
        groupId: null,
        createdAt: createdAtDate
      });
    }
  }
  if (postsData.length === 0) {
    console.log("...No public posts generated to create.");
    return [];
  }
  try {
    await prismaClient.post.createMany({
      data: postsData,
      skipDuplicates: true
    });
    console.log(`...${postsData.length} public posts created!`);
  } catch (error) {
    console.error("Error creating public posts in DB:", error);
    return [];
  }
  return createdPostsForReturn;
}

// prisma/seedModules/socialTeam/comments.ts
import { faker as faker2 } from "@faker-js/faker";
var seedPublicComments = async (prisma4, createdUsers, createdPosts, dependencies) => {
  const resolvedGenerateId = dependencies?.generateId ?? generateIdFromEntropySize;
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for comment creation. Skipping.");
    return [];
  }
  if (!createdPosts || createdPosts.length === 0) {
    console.log("No posts provided for comment creation. Skipping.");
    return [];
  }
  console.log("Creating public comments...");
  const eligiblePosts = createdPosts.filter((p) => p.groupId === null);
  if (eligiblePosts.length === 0) {
    console.log("...No public posts available for commenting. Skipping.");
    return [];
  }
  const userMap = new Map(createdUsers.map((user) => [user.id, user]));
  const commentsData = [];
  for (const post of eligiblePosts) {
    const postAuthor = userMap.get(post.userId);
    if (postAuthor?.username.includes("noComments")) {
      continue;
    }
    const commentQuantity = accountDataGenerator("random", 1, 15);
    const potentialCommenters = createdUsers.filter(
      (u) => u.id !== post.userId
    );
    if (potentialCommenters.length === 0) continue;
    for (let i = 0; i < commentQuantity; i++) {
      const commenter = faker2.helpers.arrayElement(potentialCommenters);
      commentsData.push({
        id: resolvedGenerateId(16),
        // Use resolved generateId (takes entropy size)
        content: `public comment ${faker2.lorem.sentence(5)}`,
        userId: commenter.id,
        postId: post.id,
        createdAt: faker2.date.between({
          from: post.createdAt,
          to: /* @__PURE__ */ new Date()
        })
      });
    }
  }
  if (commentsData.length === 0) {
    console.log(
      "...No eligible posts found for comment creation after filtering."
    );
    return [];
  }
  try {
    const result = await prisma4.comment.createMany({
      data: commentsData,
      skipDuplicates: true
    });
    console.log(`...${result.count} public comments created!`);
    return commentsData.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId
    }));
  } catch (error) {
    console.error("Error creating public comments in DB:", error);
    return [];
  }
};

// prisma/seedModules/eventsTeam/events.ts
var userQuantity = 1;
async function seedEvents(prismaClient, createdUsers) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedEvents.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for event creation. Skipping.");
    return [];
  }
  console.log("Creating events...");
  const eventsData = [];
  const createdEventsForReturn = [];
  const eligibleUsers = createdUsers;
  for (let i = 0; i < eligibleUsers.length; i += 4) {
    const user = eligibleUsers[i];
    const eventQuantity = accountDataGenerator("random", userQuantity, 50);
    for (let j = 0; j < eventQuantity; j++) {
      const eventId = generateIdFromEntropySize(10);
      const randomDate = faker.date.between({
        from: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1e3),
        // 2 months ago
        to: new Date(Date.now() + 14 * 30 * 24 * 60 * 60 * 1e3)
        // 14 months future
      });
      const startTime = faker.date.between({
        from: new Date(randomDate.setHours(0, 0, 0, 0)),
        to: new Date(randomDate.setHours(23, 59, 59, 999))
      });
      const endTime = faker.date.between({
        from: new Date(startTime.getTime() + 1 * 60 * 60 * 1e3),
        // At least 1hr later
        to: new Date(startTime.getTime() + 10 * 60 * 60 * 1e3)
      });
      const createdAt = faker.date.between({
        from: new Date(user.createdAt),
        to: /* @__PURE__ */ new Date()
      });
      const isCancelled = faker.datatype.boolean();
      const eventInput = {
        id: eventId,
        title: faker.lorem.words(),
        location: faker.location.city(),
        description: faker.lorem.paragraph(),
        url: faker.internet.url(),
        when: randomDate,
        startTime: startTime.toISOString().slice(11, 16),
        endTime: endTime.toISOString().slice(11, 16),
        performers: faker.helpers.shuffle(["Performer1", "Performer2", "Performer3"]).slice(0, 2),
        createdById: user.id,
        isCancelled,
        status: faker.helpers.arrayElement(["DRAFT", "PUBLISHED"]),
        visibility: faker.helpers.arrayElement(["PUBLIC", "PRIVATE"]),
        createdAt
      };
      eventsData.push(eventInput);
      createdEventsForReturn.push({
        id: eventId,
        createdById: user.id,
        isCancelled,
        createdAt
      });
    }
  }
  if (eventsData.length === 0) {
    console.log("...No events generated to create.");
    return [];
  }
  try {
    await prismaClient.event.createMany({
      data: eventsData,
      skipDuplicates: true
    });
    console.log(`...${eventsData.length} events created!`);
  } catch (error) {
    console.error("Error creating events in DB:", error);
    return [];
  }
  return createdEventsForReturn;
}

// prisma/seedModules/eventsTeam/eventAttendees.ts
async function seedEventAttendees(prismaClient, createdUsers, createdEvents) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedEventAttendees.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for event attendee creation. Skipping.");
    return [];
  }
  if (!createdEvents || createdEvents.length === 0) {
    console.log("No events provided for event attendee creation. Skipping.");
    return [];
  }
  console.log("Creating event attendees...");
  const attendeesData = [];
  const createdAttendeesForReturn = [];
  const eligibleEvents = createdEvents.filter((e) => !e.isCancelled);
  if (eligibleEvents.length === 0) {
    console.log("...No non-cancelled events found to add attendees to.");
    return [];
  }
  for (const event of eligibleEvents) {
    const creatorUser = createdUsers.find((u) => u.id === event.createdById);
    if (creatorUser) {
      const earliestCreatorJoinDate = new Date(
        Math.max(
          new Date(creatorUser.createdAt).getTime(),
          new Date(event.createdAt).getTime()
        )
      );
      const creatorCreatedAt = faker.date.between({
        from: earliestCreatorJoinDate,
        to: /* @__PURE__ */ new Date()
      });
      const creatorAttendeeInput = {
        userId: creatorUser.id,
        eventId: event.id,
        createdAt: creatorCreatedAt
      };
      attendeesData.push(creatorAttendeeInput);
      createdAttendeesForReturn.push({
        userId: creatorUser.id,
        eventId: event.id,
        createdAt: creatorCreatedAt
      });
    } else {
      console.warn(
        `Creator user with ID ${event.createdById} not found for event ${event.id}. Skipping creator addition.`
      );
    }
    const attendeeQuantity = accountDataGenerator("random", 1, 30);
    const potentialAttendees = createdUsers.filter(
      (u) => u.id !== event.createdById
    );
    for (let i = 0; i < attendeeQuantity && i < potentialAttendees.length; i++) {
      const attendeeUser = potentialAttendees[i];
      const earliestCreatedAt = new Date(
        Math.max(
          new Date(attendeeUser.createdAt).getTime(),
          new Date(event.createdAt).getTime()
        )
      );
      const createdAtDate = faker.date.between({
        from: earliestCreatedAt,
        to: /* @__PURE__ */ new Date()
      });
      const attendeeInput = {
        userId: attendeeUser.id,
        eventId: event.id,
        createdAt: createdAtDate
      };
      attendeesData.push(attendeeInput);
      createdAttendeesForReturn.push({
        userId: attendeeUser.id,
        eventId: event.id,
        createdAt: createdAtDate
      });
    }
  }
  if (attendeesData.length === 0) {
    console.log("...No event attendees generated to create.");
    return [];
  }
  try {
    await prismaClient.eventAttendee.createMany({
      data: attendeesData,
      skipDuplicates: true
    });
    console.log(`...${attendeesData.length} event attendees created!`);
  } catch (error) {
    console.error("Error creating event attendees in DB:", error);
    return [];
  }
  return createdAttendeesForReturn;
}

// prisma/seedModules/socialTeam/follows.ts
var userQuantity2 = 1;
async function seedFollows(prismaClient, createdUsers) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedFollows.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for follow creation. Skipping.");
    return [];
  }
  console.log("Creating follows...");
  const followerData = [];
  const createdFollowsForReturn = [];
  const followableUsers = createdUsers.filter(
    (user) => user.isVerified && !user.username.includes("noFollowers")
  );
  if (followableUsers.length === 0) {
    console.log("...No followable users found. Skipping follow creation.");
    return [];
  }
  for (const user of followableUsers) {
    const numberOfFollowers = accountDataGenerator("random", userQuantity2, 30);
    if (numberOfFollowers === 0) continue;
    const potentialFollowers = createdUsers.filter((u) => u.id !== user.id);
    if (potentialFollowers.length === 0) continue;
    const followers = faker.helpers.shuffle(potentialFollowers).slice(0, numberOfFollowers);
    for (const follower of followers) {
      const followInput = {
        followerId: follower.id,
        followingId: user.id
        // Add createdAt if needed: createdAt: faker.date.recent()
      };
      followerData.push(followInput);
      createdFollowsForReturn.push({
        followerId: follower.id,
        followingId: user.id
      });
    }
  }
  if (followerData.length === 0) {
    console.log("...No follows generated to create.");
    return [];
  }
  try {
    await prismaClient.follow.createMany({
      data: followerData,
      skipDuplicates: true
    });
    console.log(`...${followerData.length} follows created!`);
  } catch (error) {
    console.error("Error creating follows in DB:", error);
    return [];
  }
  return createdFollowsForReturn;
}

// prisma/seedModules/groupsTeam/groupPosts.ts
async function seedGroupPosts(prismaClient, createdGroups, createdGroupMembers) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedGroupPosts.");
    return [];
  }
  if (!createdGroups || createdGroups.length === 0) {
    console.log("No groups provided for group post creation. Skipping.");
    return [];
  }
  if (!createdGroupMembers || createdGroupMembers.length === 0) {
    console.log("No group members provided for group post creation. Skipping.");
    return [];
  }
  console.log("Creating group posts...");
  const postsData = [];
  const createdPostsForReturn = [];
  const membersByGroup = /* @__PURE__ */ new Map();
  for (const member of createdGroupMembers) {
    if (member.acceptedInvite) {
      if (!membersByGroup.has(member.groupId)) {
        membersByGroup.set(member.groupId, []);
      }
      membersByGroup.get(member.groupId).push(member);
    }
  }
  for (const group of createdGroups) {
    const members = membersByGroup.get(group.id);
    if (!members || members.length === 0) {
      continue;
    }
    const postQuantity = accountDataGenerator("random", 1, 10);
    for (let i = 0; i < postQuantity; i++) {
      const postAuthor = faker.helpers.arrayElement(members);
      const postId = generateIdFromEntropySize(10);
      const createdAtDate = faker.date.between({
        from: new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1e3),
        to: /* @__PURE__ */ new Date()
      });
      const postInput = {
        id: postId,
        content: `group post ${faker.lorem.sentence()}`,
        userId: postAuthor.userId,
        groupId: group.id,
        createdAt: createdAtDate
      };
      postsData.push(postInput);
      createdPostsForReturn.push({
        id: postId,
        userId: postAuthor.userId,
        groupId: group.id,
        createdAt: createdAtDate,
        content: `group post ${faker.lorem.sentence()}`
      });
    }
  }
  if (postsData.length === 0) {
    console.log("...No group posts generated to create.");
    return [];
  }
  try {
    await prismaClient.post.createMany({
      data: postsData,
      skipDuplicates: true
    });
    console.log(`...${postsData.length} group posts created!`);
  } catch (error) {
    console.error("Error creating group posts in DB:", error);
    return [];
  }
  return createdPostsForReturn;
}

// prisma/seedModules/socialTeam/likesDislikes.ts
async function seedLikesDislikes(prismaClient, createdUsers, createdPosts) {
  const defaultResult = {
    createdLikes: [],
    createdDislikes: []
  };
  if (!prismaClient) {
    console.error("Prisma client is not available for seedLikesDislikes.");
    return defaultResult;
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for like/dislike creation. Skipping.");
    return defaultResult;
  }
  if (!createdPosts || createdPosts.length === 0) {
    console.log("No posts provided for like/dislike creation. Skipping.");
    return defaultResult;
  }
  console.log("Creating likes and dislikes...");
  const likesData = [];
  const dislikesData = [];
  const createdLikesForReturn = [];
  const createdDislikesForReturn = [];
  const eligibleUsers = createdUsers;
  const eligiblePosts = createdPosts;
  if (eligibleUsers.length === 0 || eligiblePosts.length === 0) {
    console.log(
      "...Not enough users or posts to generate likes/dislikes. Skipping."
    );
    return { createdLikes: [], createdDislikes: [] };
  }
  for (const post of eligiblePosts) {
    const likerDislikerQuantity = accountDataGenerator("random", 1, 15);
    const potentialLikersDislikers = faker.helpers.shuffle(eligibleUsers).filter((u) => u.id !== post.userId);
    for (let i = 0; i < likerDislikerQuantity && i < potentialLikersDislikers.length; i++) {
      const user = potentialLikersDislikers[i];
      const action = faker.helpers.arrayElement(["LIKE", "DISLIKE", null]);
      if (action === "LIKE") {
        const likeInput = {
          userId: user.id,
          postId: post.id
        };
        likesData.push(likeInput);
        createdLikesForReturn.push({ userId: user.id, postId: post.id });
      } else if (action === "DISLIKE") {
        const dislikeInput = {
          userId: user.id,
          postId: post.id
        };
        dislikesData.push(dislikeInput);
        createdDislikesForReturn.push({ userId: user.id, postId: post.id });
      }
    }
  }
  let createdLikesCount = 0;
  let createdDislikesCount = 0;
  try {
    if (likesData.length > 0) {
      const result = await prismaClient.like.createMany({
        data: likesData,
        skipDuplicates: true
      });
      createdLikesCount = result.count;
      console.log(`...${createdLikesCount} likes created!`);
    } else {
      console.log("...No likes generated to create.");
    }
  } catch (error) {
    console.error("Error creating likes in DB:", error);
  }
  try {
    if (dislikesData.length > 0) {
      const result = await prismaClient.dislike.createMany({
        data: dislikesData,
        skipDuplicates: true
      });
      createdDislikesCount = result.count;
      console.log(`...${createdDislikesCount} dislikes created!`);
    } else {
      console.log("...No dislikes generated to create.");
    }
  } catch (error) {
    console.error("Error creating dislikes in DB:", error);
  }
  return {
    createdLikes: createdLikesForReturn,
    createdDislikes: createdDislikesForReturn
  };
}

// prisma/seedModules/socialTeam/bookmarks.ts
var seedBookmarks = async (prisma4, createdUsers, createdPosts) => {
  console.log("Creating bookmarks...");
  if (!prisma4) {
    console.error("Prisma client is not available for seedBookmarks.");
    return;
  }
  if (createdPosts.length === 0 || createdUsers.length === 0) {
    console.log("No posts or users provided for bookmark creation. Skipping.");
    return;
  }
  const allBookmarks = [];
  const eligibleUsers = createdUsers.filter(
    (u) => !u.username.includes("noBookmarks")
    // Exclude specific users
  );
  if (eligibleUsers.length === 0) {
    console.log("No eligible users found to create bookmarks.");
    return;
  }
  for (let i = 0; i < createdPosts.length; i += 2) {
    const post = createdPosts[i];
    if (!post) continue;
    const potentialBookmarkers = eligibleUsers.filter(
      (u) => u.id !== post.userId
    );
    if (potentialBookmarkers.length === 0) continue;
    const bookmarkerQuantity = accountDataGenerator("random", 1, 10);
    const selectedBookmarkers = faker.helpers.shuffle(potentialBookmarkers).slice(0, bookmarkerQuantity);
    for (const user of selectedBookmarkers) {
      allBookmarks.push({
        userId: user.id,
        postId: post.id
        // createdAt can be added if needed, defaults to now()
      });
    }
  }
  if (allBookmarks.length > 0) {
    try {
      const result = await prisma4.bookmark.createMany({
        data: allBookmarks,
        skipDuplicates: true
      });
      console.log(`...${result.count} bookmarks created!`);
    } catch (error) {
      console.error("Error creating bookmarks in DB:", error);
    }
  } else {
    console.log("No bookmarks generated.");
  }
  return;
};

// prisma/seedModules/mediaTeam/media.ts
import { MediaType } from "@prisma/client";
async function seedMedia(prismaClient, allPosts) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedMedia.");
    return;
  }
  if (!allPosts || allPosts.length === 0) {
    console.log("No posts provided for media creation. Skipping.");
    return;
  }
  console.log("Creating media for posts...");
  const mediaData = [];
  const mediaTypes = [MediaType.IMAGE, MediaType.VIDEO];
  const getMediaUrl = (type) => {
    if (type === MediaType.IMAGE) {
      return `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/400/300`;
    } else if (type === MediaType.VIDEO) {
      return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    }
    return "";
  };
  for (let i = 0; i < allPosts.length; i += 2) {
    const post = allPosts[i];
    const numberOfMedia = faker.number.int({ min: 0, max: 5 });
    if (numberOfMedia === 0) continue;
    for (let j = 0; j < numberOfMedia; j++) {
      const type = faker.helpers.arrayElement(mediaTypes);
      const url = getMediaUrl(type);
      if (url) {
        const mediaInput = {
          type,
          url,
          postId: post.id
        };
        mediaData.push(mediaInput);
      }
    }
  }
  if (mediaData.length === 0) {
    console.log("...No media generated to create.");
    return;
  }
  try {
    const result = await prismaClient.media.createMany({
      data: mediaData,
      skipDuplicates: true
    });
    console.log(`...${result.count} pieces of media created!`);
  } catch (error) {
    console.error("Error creating media in DB:", error);
  }
}

// prisma/seedModules/groupsTeam/groupComments.ts
async function seedGroupComments(prismaClient, createdGroupPosts, createdGroupMembers, createdUsers) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedGroupComments.");
    return [];
  }
  if (!createdGroupPosts || createdGroupPosts.length === 0) {
    console.log(
      "No group posts provided for group comment creation. Skipping."
    );
    return [];
  }
  if (!createdGroupMembers || createdGroupMembers.length === 0) {
    console.log(
      "No group members provided for group comment creation. Skipping."
    );
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for group comment creation. Skipping.");
    return [];
  }
  console.log("Creating group comments...");
  const commentsData = [];
  const createdCommentsForReturn = [];
  const membersByGroup = /* @__PURE__ */ new Map();
  for (const member of createdGroupMembers) {
    if (member.acceptedInvite) {
      if (!membersByGroup.has(member.groupId)) {
        membersByGroup.set(member.groupId, []);
      }
      membersByGroup.get(member.groupId).push(member);
    }
  }
  for (const post of createdGroupPosts) {
    const membersInGroup = membersByGroup.get(post.groupId);
    if (!membersInGroup || membersInGroup.length === 0) {
      continue;
    }
    const commentQuantity = accountDataGenerator("random", 1, 10);
    for (let i = 0; i < commentQuantity; i++) {
      const commenterMember = faker.helpers.arrayElement(membersInGroup);
      const commentId = generateIdFromEntropySize(10);
      const createdAtDate = faker.date.between({
        // Ensure comment is after post
        from: new Date(post.createdAt),
        to: /* @__PURE__ */ new Date()
      });
      const commentInput = {
        id: commentId,
        content: `group comment ${faker.lorem.sentence()}`,
        // Use direct foreign keys
        userId: commenterMember.userId,
        postId: post.id,
        // groupId is likely not part of CommentCreateManyInput
        createdAt: createdAtDate
      };
      commentsData.push(commentInput);
      createdCommentsForReturn.push({
        id: commentId,
        userId: commenterMember.userId,
        postId: post.id
      });
    }
  }
  if (commentsData.length === 0) {
    console.log("...No group comments generated to create.");
    return [];
  }
  try {
    await prismaClient.comment.createMany({
      data: commentsData,
      skipDuplicates: true
    });
    console.log(`...${commentsData.length} group post comments created!`);
  } catch (error) {
    console.error("Error creating group comments in DB:", error);
    return [];
  }
  return createdCommentsForReturn;
}

// prisma/seedModules/notificationsTeam/notifications.ts
import { NotificationType } from "@prisma/client";
async function seedNotifications(prismaClient, allPosts, allComments, createdLikes, createdDislikes, createdFollows, createdEvents, createdAttendees) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedNotifications.");
    return;
  }
  console.log("Creating notifications...");
  const notificationData = [];
  const postMap = new Map(allPosts.map((post) => [post.id, post]));
  const eventMap = new Map(createdEvents.map((event) => [event.id, event]));
  const attendeesByEvent = /* @__PURE__ */ new Map();
  for (const attendee of createdAttendees) {
    const attendees = attendeesByEvent.get(attendee.eventId) || [];
    attendees.push(attendee);
    attendeesByEvent.set(attendee.eventId, attendees);
  }
  console.log("  Generating comment notifications...");
  for (const comment of allComments) {
    const post = postMap.get(comment.postId);
    if (post && post.userId !== comment.userId) {
      notificationData.push({
        recipientId: post.userId,
        issuerId: comment.userId,
        postId: post.id,
        type: NotificationType.COMMENT,
        read: faker.datatype.boolean(0.8),
        // 80% unread
        createdAt: faker.date.recent({ days: 30 })
      });
    }
  }
  console.log("  Generating like notifications...");
  for (const like of createdLikes) {
    const post = postMap.get(like.postId);
    if (post && post.userId !== like.userId) {
      notificationData.push({
        recipientId: post.userId,
        issuerId: like.userId,
        postId: post.id,
        type: NotificationType.LIKE,
        read: faker.datatype.boolean(0.8),
        createdAt: faker.date.recent({ days: 30 })
      });
    }
  }
  console.log("  Generating dislike notifications...");
  for (const dislike of createdDislikes) {
    const post = postMap.get(dislike.postId);
    if (post && post.userId !== dislike.userId) {
      notificationData.push({
        recipientId: post.userId,
        issuerId: dislike.userId,
        postId: post.id,
        type: NotificationType.DISLIKE,
        read: faker.datatype.boolean(0.8),
        createdAt: faker.date.recent({ days: 30 })
      });
    }
  }
  console.log("  Generating follow notifications...");
  for (const follow of createdFollows) {
    notificationData.push({
      recipientId: follow.followingId,
      issuerId: follow.followerId,
      type: NotificationType.FOLLOW,
      read: faker.datatype.boolean(0.8),
      createdAt: faker.date.recent({ days: 30 })
    });
  }
  console.log("  Generating event attendee notifications...");
  for (const attendee of createdAttendees) {
    const event = eventMap.get(attendee.eventId);
    if (event && event.createdById !== attendee.userId) {
      notificationData.push({
        recipientId: event.createdById,
        issuerId: attendee.userId,
        eventId: event.id,
        type: NotificationType.EVENT_ATTENDEE,
        read: faker.datatype.boolean(0.8),
        createdAt: faker.date.recent({ days: 30 })
      });
    }
  }
  console.log("  Generating event cancellation notifications...");
  const cancelledEvents = createdEvents.filter((event) => event.isCancelled);
  for (const event of cancelledEvents) {
    const attendees = attendeesByEvent.get(event.id) || [];
    for (const attendee of attendees) {
      if (attendee.userId !== event.createdById) {
        notificationData.push({
          recipientId: attendee.userId,
          issuerId: event.createdById,
          eventId: event.id,
          type: NotificationType.EVENT_CANCELLED,
          read: faker.datatype.boolean(0.8),
          createdAt: faker.date.recent({ days: 30 })
        });
      }
    }
  }
  if (notificationData.length === 0) {
    console.log("...No notifications generated to create.");
    return;
  }
  console.log(
    `Attempting to create ${notificationData.length} notifications...`
  );
  try {
    const result = await prismaClient.notification.createMany({
      data: notificationData,
      skipDuplicates: true
      // Important for idempotency if script reruns
    });
    console.log(`...${result.count} notifications created!`);
  } catch (error) {
    console.error("Error creating notifications in DB:", error);
  }
}

// prisma/seed.ts
var {
  prisma: prisma3,
  // Use shared prisma instance
  streamChatClient: streamChatClient2,
  // Use shared stream client instance
  cypressEnv: cypressEnv5,
  // Use shared cypress env data
  faker: faker3,
  // Use shared faker instance
  generateIdFromEntropySize: generateIdFromEntropySize6,
  // Use shared ID generator
  passwordHash: passwordHash2,
  // Use shared hash function
  // Import other helpers if needed: random, weightedRandom, etc.
  accountDataGenerator: accountDataGenerator3,
  // Example: if createUsers still uses it
  GroupRole: GroupRole2,
  // Enums if needed
  NotificationType: NotificationType2
} = await import("./seedUtils-YXFADVGQ.js");
async function main() {
  console.log("Initiating deletion phase...");
  const deletedUserIds = await deleteTestUsers(prisma3);
  await deleteTestUsersFromStreamChat(streamChatClient2, deletedUserIds);
  console.log("Deletion phase completed.");
  console.log("Start seeding...");
  try {
    await prisma3.$transaction(
      async (tx) => {
        console.log("Starting Prisma transaction for seeding...");
        const createdUsers = await seedUsers(
          tx,
          streamChatClient2,
          passwordHash2
        );
        if (createdUsers.length === 0)
          throw new Error("User seeding failed, aborting transaction.");
        const createdGroups = await seedGroups(tx, createdUsers);
        const createdGroupMembers = await seedGroupMembers(
          tx,
          // Pass tx
          createdUsers,
          createdGroups
        );
        if (createdGroupMembers.length === 0 && createdGroups.length > 0) {
          console.warn(
            "Warning: Group member seeding resulted in 0 members despite groups existing."
          );
        }
        const createdPublicPosts = await seedPublicPosts(
          tx,
          createdUsers
        );
        const createdPublicComments = await seedPublicComments(
          tx,
          createdUsers,
          createdPublicPosts
        );
        const createdEvents = await seedEvents(tx, createdUsers);
        const createdAttendees = await seedEventAttendees(
          tx,
          createdUsers,
          createdEvents
        );
        const createdFollowers = await seedFollows(tx, createdUsers);
        const createdGroupPosts = await seedGroupPosts(
          tx,
          createdGroups,
          createdGroupMembers
        );
        const allPosts = [...createdPublicPosts, ...createdGroupPosts];
        const { createdLikes, createdDislikes } = await seedLikesDislikes(
          tx,
          createdUsers,
          allPosts
        );
        await seedBookmarks(tx, createdUsers, allPosts);
        await seedMedia(tx, allPosts);
        const createdGroupComments = await seedGroupComments(
          tx,
          createdGroupPosts,
          createdGroupMembers,
          createdUsers
          // Pass createdUsers here too
        );
        const allComments = [
          ...createdPublicComments,
          ...createdGroupComments
        ];
        await seedNotifications(
          tx,
          allPosts,
          allComments,
          createdLikes,
          createdDislikes,
          createdFollowers,
          createdEvents,
          createdAttendees
        );
        console.log("Prisma transaction committed successfully.");
      },
      {
        timeout: 6e4
        // Increase timeout to 60 seconds (60000 ms)
      }
    );
    console.log("Seeding finished: All modules executed successfully.");
  } catch (error) {
    console.error("Error during seeding transaction:", error);
    throw error;
  }
}
main().catch((e) => {
  console.error("Seeding script failed:", e);
  process.exit(1);
}).finally(async () => {
  await prisma3.$disconnect();
  console.log("end of seeding, Prisma client disconnected.");
});
