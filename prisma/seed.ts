const { PrismaClient, GroupRole, NotificationType } = require("@prisma/client");
const dotenv = require("dotenv");
const prisma = new PrismaClient();
const faker = require("@faker-js/faker").faker;
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { hash } = require("argon2");
const Prisma = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const { StreamChat } = require("stream-chat");
const cypressEnvPath = path.resolve(__dirname, "../cypress.env.json");
const cypressEnv = JSON.parse(fs.readFileSync(cypressEnvPath, "utf-8"));
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });
let generateIdFromEntropySize: any;
(async () => {
  const luciaModule = await import("lucia");
  generateIdFromEntropySize = luciaModule.generateIdFromEntropySize;
})();
const streamKey = process.env.NEXT_PUBLIC_STREAM_KEY;
const streamSecret = process.env.STREAM_SECRET;

// Number of each type of user to generate
// Example: If userQuantity = 1, you get ["verifiedUser"]
//          If userQuantity = 2, you get ["verifiedUser1", "verifiedUser2"], etc.
const userQuantity = 1;

// Generates a random integer between min and max (inclusive).
// Example: random(5, 10) could return any number from 5 to 10, including both 5 and 10.
const random = (min: number, max: number) => faker.number.int({ min, max });

// Generates a weighted random number based on a base value and an optional factor.
// The result is influenced by a random float between 0.5 and 1.5 to add variability.
// Example: weightedRandom(10) will return a value between 5 (10 * 0.5) and 15 (10 * 1.5).
// Example: weightedRandom(20, 2) will return a value between 20 (20 * 2 * 0.5) and 60 (20 * 2 * 1.5).
const weightedRandom = (base: number, factor = 1) => {
  return Math.floor(
    base * factor * faker.datatype.float({ min: 0.5, max: 1.5 }),
  );
};

// Generates a proportionate random number based on the number of users and a factor.
// The result is a random integer between half and one and a half times the product of users and factor.
// Example: proportionateRandom(10, 2) will return a value between 10 (10 * 2 * 0.5) and 30 (10 * 2 * 1.5).
// Example: proportionateRandom(5, 3) will return a value between 7.5 (5 * 3 * 0.5) and 22.5 (5 * 3 * 1.5).
const proportionateRandom = (users: number, factor: number) => {
  return random(
    Math.ceil(users * factor * 0.5),
    Math.ceil(users * factor * 1.5),
  );
};

// Generates account data based on the provided value, number of users, and a factor.
// If the value is "random", it generates a proportionate random number based on users and factor.
// Otherwise, it returns the value as a number.
// Example: accountDataGenerator("random", 10, 2) will return a value between 10 and 30.
// Example: accountDataGenerator(5, 10, 2) returns 5 (since the value isn't "random").
const accountDataGenerator = (
  value: string | number,
  users: number,
  factor: number,
) => {
  if (value === "random") {
    return proportionateRandom(users, factor);
  }
  return Number(value);
};

const streamChatClient = StreamChat.getInstance(streamKey, streamSecret);

interface TestUserData {
  quantityOfEachUser: number;
  password: string;
  userTypes: string[];
}

// prettier-ignore
const testUserData: TestUserData = {
  quantityOfEachUser: userQuantity,
  password: cypressEnv.password,
  userTypes: Object.keys(cypressEnv).filter(key => key.endsWith('Username')).map(key => key.replace('Username', '')),
};

// 1. Helper function to delete existing test user data
async function deleteTestUsers() {
  console.log("Deleting testUsers and data from Database...");

  const partialUsernames = testUserData.userTypes.map(
    (userType) =>
      `testUser${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
  );

  try {
    const usersToDelete = await prisma.user.findMany({
      where: {
        OR: partialUsernames.map((partialName) => ({
          username: {
            contains: partialName,
          },
        })),
      },
      select: {
        id: true,
      },
    });

    const userIds = usersToDelete.map((user: any) => user.id);

    await prisma.event.deleteMany({
      where: {
        createdById: {
          in: userIds,
        },
      },
    });

    // Add other related deletions here as needed
    // For example, if you have other models like posts, comments, etc.
    await prisma.post.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    await prisma.comment.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });

    console.log(`...${userIds.length} test users deleted successfully!`);
  } catch (error) {
    console.error("Error deleting test users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 2. Helper funciton to delete test user data from StreamChat
const deleteTestUsersFromStreamChat = async (testUsernames: string[]) => {
  try {
    // Initialize StreamChat client
    const client = StreamChat.getInstance(streamKey, streamSecret);

    // Query StreamChat for specific test users
    const streamUsers = await client.queryUsers({
      id: { $in: testUsernames },
    });

    // Delete test users from StreamChat
    for (const user of streamUsers.users) {
      try {
        await client.deleteUser(user.id, {
          hardDelete: true, // Permanently deletes the user
        });
        console.log(`Deleted test user from StreamChat: ${user.id}`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            `Failed to delete test user ${user.id}:`,
            error.message,
          );
        } else {
          console.error(`Failed to delete test user ${user.id}:`, error);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error during test user synchronization:", error.message);
    } else {
      console.error("Error during test user synchronization:", error);
    }
  }
};

// 3. Helper function to create users
const createUsers = async (testUserData: TestUserData) => {
  const quantity = testUserData.quantityOfEachUser;
  const userTypes = testUserData.userTypes;
  const password = testUserData.password;
  const users: any = [];

  console.log(
    `Creating ${userQuantity * Object.keys(userTypes).length} users...`,
  );

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  for (const userType of userTypes) {
    for (let i = 0; i < quantity; i++) {
      const userId = generateIdFromEntropySize(10);
      // Format username as `testUserType1`, `testUserType2`, etc.
      const username = `testUser${userType.charAt(0).toUpperCase() + userType.slice(1)}${quantity > 1 ? i + 1 : ""}`;
      const email = `${username.toLowerCase()}@example.com`;
      const isGoogleLoginUser = username.includes("GoogleLogin");
      const googleId = isGoogleLoginUser
        ? `${faker.string.numeric(10)}${faker.string.alphanumeric(10)}`
        : null;

      const userPasswordHash = isGoogleLoginUser ? null : passwordHash;

      // Set user as verified if the type does not include "unverified"
      const isVerified = !userType.includes("unverified");
      const hasAvatar = !userType.includes("noAvatar") && Math.random() < 0.8; // 80% chance of having an avatar

      let avatarUrl = hasAvatar
        ? `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`
        : null;

      const isNoBioUser = username.includes("NoBio");
      const bio = isNoBioUser ? null : faker.lorem.sentence();
      const randomDate = faker.date.between({
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        to: new Date(),
      });

      users.push({
        id: userId,
        username,
        email,
        displayName: username,
        passwordHash: userPasswordHash,
        isVerified,
        avatarUrl,
        googleId,
        bio,
        createdAt: randomDate,
      });
    }

    await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });
  }

  console.log(`Adding ${users.length} users to StreamChat...`);

  // Add users to StreamChat in bulk
  const streamChatUsers = users.map((user: any) => ({
    id: user.id,
    name: user.displayName,
    image: user.avatarUrl,
    email: user.email,
  }));

  try {
    await streamChatClient.upsertUsers(streamChatUsers);
    console.log(`...${users.length} new users added to StreamChat!`);
  } catch (error) {
    console.error(
      `Failed to add users to StreamChat:`,
      (error as Error).message,
    );
  }

  return users;
};

// 4. Helper function to create groups
const createGroups = async (usersCreated: Record<string, any[]>) => {
  console.log(`Creating groups...`);

  // Gather all users except those in the "noGroupMemberships" category
  const eligibleUsers = Object.keys(usersCreated)
    .filter((userType) => userType !== "noGroupMemberships")
    .flatMap((userType) => usersCreated[userType]);

  const groupsData = [];

  for (const user of eligibleUsers) {
    const numberOfGroups = accountDataGenerator("random", userQuantity, 2);
    // console.log(
    //   `Creating ${numberOfGroups} groups for user ${user.username}...`,
    // );

    for (let i = 0; i < numberOfGroups; i++) {
      const groupId = generateIdFromEntropySize(10);

      const randomDate = faker.date.between({
        from: new Date(user.createdAt),
        to: new Date(),
      });

      groupsData.push({
        id: groupId,
        name: faker.company.name(),
        description: faker.lorem.sentence(),
        ownerId: user.id,
        createdAt: randomDate,
      });
    }
  }

  await prisma.group.createMany({
    data: groupsData,
    skipDuplicates: true,
  });

  console.log(`...${groupsData.length} groups created!`);

  return groupsData;
};

// 5. Helper function to create group members
const createGroupMembers = async (
  usersCreated: Record<string, any[]>,
  groupsCreated: any[],
) => {
  console.log("Creating group members...");
  const groupMembersData = [];
  let totalMembersCreated = 0;

  for (const group of groupsCreated) {
    const numberOfMembers = accountDataGenerator("random", userQuantity, 3);
    // console.log(`Creating ${numberOfMembers} members in group ${group.id}...`);

    const eligibleUsers = Object.keys(usersCreated)
      .filter((userType) => userType !== "noGroupMemberships")
      .flatMap((userType) => usersCreated[userType]);

    let members = faker.helpers
      .shuffle(Object.values(eligibleUsers).flat())
      .slice(0, numberOfMembers);

    // Add specific members to the group
    if (usersCreated.fMemberOfGroupG) {
      members.push(...usersCreated.fMemberOfGroupG);
    }
    if (usersCreated.iMemberOfGroupG) {
      members.push(...usersCreated.iMemberOfGroupG);
    }

    // Ensure hNotMemberOfGroupG is not a member when gOwnerOfGroup is the owner
    if (usersCreated.hNotMemberOfGroupG) {
      members = members.filter(
        (member: any) =>
          !(
            member.id === group.ownerId &&
            usersCreated.hNotMemberOfGroupG.some((u) => u.id === member.id)
          ),
      );
    }

    for (const member of members) {
      // Avoid adding the group owner as a member
      if (member.id === group.ownerId) continue;
      const groupMemberId = generateIdFromEntropySize(10);

      const role = member.username.includes("groupAdmin")
        ? GroupRole.ADMIN
        : faker.helpers.arrayElement([GroupRole.MEMBER, GroupRole.ADMIN]);

      const userCreatedAt = new Date(member.createdAt);
      const groupCreatedAt = new Date(group.createdAt);
      const earliestJoinedDate = new Date(
        Math.max(userCreatedAt.getTime(), groupCreatedAt.getTime()),
      );

      const randomDate = faker.date.between({
        from: earliestJoinedDate,
        to: new Date(),
      });
      groupMembersData.push({
        id: groupMemberId,
        userId: member.id,
        groupId: group.id,
        role,
        acceptedInvite: faker.datatype.boolean(),
        joinedAt: randomDate,
      });

      totalMembersCreated++;
    }
  }

  await prisma.groupMember.createMany({
    data: groupMembersData,
    skipDuplicates: true,
  });

  console.log(
    `...${totalMembersCreated} members across ${groupsCreated.length} groups created!`,
  );
  return groupMembersData;
};

// 6. Helper function to create public posts
const createPublicPosts = async (usersCreated: Record<string, any[]>) => {
  console.log("Creating public posts...");
  const postsData = [];

  const eligibleUsers = Object.keys(usersCreated)
    .filter((userType) => userType !== "noPosts")
    .flatMap((userType) => usersCreated[userType])
    .filter((user) => user.isVerified);

  for (let i = 0; i < eligibleUsers.length; i++) {
    const user = eligibleUsers[i];
    const numberOfPosts = user.username.includes("UserManyPosts")
      ? 50
      : accountDataGenerator("random", userQuantity, 5);

    // console.log(
    //   `Creating ${numberOfPosts} public posts for ${user.username}...`,
    // );

    for (let j = 0; j < numberOfPosts; j++) {
      const postId = generateIdFromEntropySize(10);

      const randomDate = faker.date.between({
        from: new Date(user.createdAt),
        to: new Date(),
      });

      postsData.push({
        id: postId,
        content: `public post ${faker.lorem.sentence()}`,
        userId: user.id,
        createdAt: randomDate,
      });
    }
  }

  await prisma.post.createMany({
    data: postsData,
    skipDuplicates: true,
  });

  console.log(`...${postsData.length} public posts created!`);

  return postsData;
};

// 7. Helper function to create public comments
const createComments = async (
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log("Creating public comments...");
  const commentsData = [];
  let totalCommentsCreated = 0;

  const userKeys = Object.keys(usersCreated);

  for (let i = 0; i < userKeys.length; i++) {
    const post = postsCreated[i];
    const postUser = Object.values(usersCreated)
      .flat()
      .find((u) => u.id === post.userId);
    const numberOfComments = postUser?.username.includes("noComments")
      ? 0
      : accountDataGenerator("random", userQuantity, 20);

    // console.log(`Creating ${numberOfComments} comments on ${post.id}...`);

    for (let j = 0; j < numberOfComments; j++) {
      const commentId = generateIdFromEntropySize(10);
      const user = faker.helpers.arrayElement(
        Object.values(usersCreated).flat(),
      );
      const commentCreatedAt = faker.date.between({
        from: new Date(post.createdAt),
        to: new Date(),
      });

      commentsData.push({
        id: commentId,
        content: `public comment ${faker.lorem.sentence()}`,
        userId: user.id,
        postId: post.id,
        createdAt: commentCreatedAt,
      });

      totalCommentsCreated++;
    }
  }

  await prisma.comment.createMany({
    data: commentsData,
    skipDuplicates: true,
  });

  console.log(
    `...${totalCommentsCreated} comments across ${postsCreated.length} posts created!`,
  );

  return commentsData;
};

// 8. Helper function to create events
const createEvents = async (usersCreated: any[]) => {
  console.log("Creating events...");

  const eventsData = [];

  for (let i = 0; i < usersCreated.length; i++) {
    const user = usersCreated[i];
    const eventQuantity = accountDataGenerator("random", userQuantity, 20);
    // console.log(
    //   `Creating ${eventQuantity} events for user ${user.username}...`,
    // );
    for (let j = 0; j < eventQuantity; j++) {
      const eventId = generateIdFromEntropySize(10);

      const randomDate = faker.date.between({
        from: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000), // 2 months ago
        to: new Date(Date.now() + 14 * 30 * 24 * 60 * 60 * 1000), // 14 months in the future
      });

      const startTime = faker.date.between({
        from: new Date(randomDate.setHours(0, 0, 0, 0)), // Start of the day
        to: new Date(randomDate.setHours(23, 59, 59, 999)), // End of the day
      });

      const endTime = faker.date.between({
        from: new Date(startTime.getTime() + 1 * 60 * 60 * 1000), // At least 1 hour after start time
        to: new Date(startTime.getTime() + 10 * 60 * 60 * 1000), // Up to 10 hours after start time
      });

      const createdAt = faker.date.between({
        from: new Date(user.createdAt),
        to: new Date(),
      });

      eventsData.push({
        id: eventId,
        title: faker.lorem.words(),
        location: faker.location.city(),
        description: faker.lorem.paragraph(),
        url: faker.internet.url(),
        when: randomDate.toISOString(),
        startTime: startTime.toISOString().slice(11, 16),
        endTime: endTime.toISOString().slice(11, 16),
        performers: faker.helpers
          .shuffle(["Performer1", "Performer2", "Performer3"])
          .slice(0, 2),
        createdById: user.id,
        isCancelled: faker.datatype.boolean(),
        status: faker.helpers.arrayElement(["DRAFT", "PUBLISHED"]),
        visibility: faker.helpers.arrayElement(["PUBLIC", "PRIVATE"]),
        createdAt,
      });
    }
  }

  await prisma.event.createMany({
    data: eventsData,
    skipDuplicates: true,
  });

  console.log(`...${eventsData.length} events created!`);

  return eventsData;
};

// 9. Helper function to create event attendees
const createEventAttendees = async (
  usersCreated: Record<string, any[]>,
  eventsCreated: any[],
) => {
  console.log("Creating event attendees...");
  const eventAttendeesData = [];

  for (const event of eventsCreated) {
    const eventCreator = Object.values(usersCreated)
      .flat()
      .find((user) => user.id === event.createdById);

    if (eventCreator) {
      eventAttendeesData.push({
        userId: eventCreator.id,
        eventId: event.id,
        createdAt: faker.date.between({
          from: new Date(event.createdAt),
          to: new Date(),
        }),
      });
    }

    const numberOfAdditionalAttendees = faker.number.int({ min: 0, max: 15 });

    // console.log(
    //   `Creating ${numberOfAdditionalAttendees} attendees for event ${event.id}...`,
    // );
    const additionalAttendees = faker.helpers
      .shuffle(Object.values(usersCreated).flat())
      .filter((user: any) => user.id !== eventCreator.id)
      .slice(0, numberOfAdditionalAttendees);

    for (const attendee of additionalAttendees) {
      eventAttendeesData.push({
        userId: attendee.id,
        eventId: event.id,
        createdAt: faker.date.between({
          from: new Date(event.createdAt),
          to: new Date(),
        }),
      });
    }
  }

  await prisma.eventAttendee.createMany({
    data: eventAttendeesData,
    skipDuplicates: true,
  });

  console.log(`...${eventAttendeesData.length} event attendees created!`);

  return eventAttendeesData;
};

// 10 Helper function to create follows
const createFollowers = async (usersCreated: Record<string, any[]>) => {
  console.log("Creating followers...");
  const followerData = [];

  const users = Object.values(usersCreated).flat();

  for (const user of users) {
    const numberOfFollowers = accountDataGenerator("random", userQuantity, 10);
    // console.log(
    //   `Creating ${numberOfFollowers} followers for user ${user.id}...`,
    // );

    const followers = faker.helpers
      .shuffle(users)
      .filter((follower: any) => follower.id !== user.id) // Ensure a user does not follow themselves
      .slice(0, numberOfFollowers);

    for (const follower of followers) {
      followerData.push({
        followerId: follower.id,
        followingId: user.id,
      });
    }
  }

  await prisma.follow.createMany({
    data: followerData,
    skipDuplicates: true,
  });

  console.log(`...${followerData.length} followers created!`);

  return followerData;
};

// 11. Helper function to create group posts
const createGroupPosts = async (groupsCreated: any[], groupMembers: any[]) => {
  console.log("Creating group posts...");
  const groupPostsData = [];

  const groupsWithMembers = groupsCreated.filter((group) =>
    groupMembers.some(
      (member) => member.groupId === group.id && member.acceptedInvite === true,
    ),
  );

  for (const group of groupsWithMembers) {
    const numberOfPosts = accountDataGenerator("random", userQuantity, 10);

    const usersInGroup = groupMembers.filter(
      (member) => member.groupId === group.id && member.acceptedInvite === true,
    );

    for (let j = 0; j < numberOfPosts; j++) {
      const groupPostId = generateIdFromEntropySize(10);

      const user = faker.helpers.arrayElement(usersInGroup);

      const randomDate = faker.date.between({
        from: new Date(user.joinedAt),
        to: new Date(),
      });

      groupPostsData.push({
        id: groupPostId,
        content: `group post ${faker.lorem.sentence()}`,
        userId: user.userId,
        groupId: group.id,
        createdAt: randomDate,
      });
    }
  }

  await prisma.post.createMany({
    data: groupPostsData,
    skipDuplicates: true,
  });

  console.log(`...${groupPostsData.length} group posts created!`);

  return groupPostsData;
};

// 12. Helper function to create likes
const createLikes = async (
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log("Creating likes...");
  const likeData = [];

  for (let i = 0; i < postsCreated.length; i++) {
    const post = postsCreated[i];
    const numberOfLikes = accountDataGenerator("random", userQuantity, 5);

    // console.log(`Creating ${numberOfLikes} likes for post ${post.id}...`);

    const likers = faker.helpers
      .shuffle(Object.values(usersCreated).flat())
      .slice(0, numberOfLikes);

    for (const liker of likers) {
      likeData.push({
        userId: liker.id,
        postId: post.id,
      });
    }
  }

  await prisma.like.createMany({
    data: likeData,
    skipDuplicates: true,
  });

  console.log(`...${likeData.length} likes created!`);

  return likeData;
};

// 13. Helper function to create dislikes
const createDislikes = async (
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log("Creating dislikes...");
  const dislikeData = [];

  for (let i = 0; i < postsCreated.length; i++) {
    const post = postsCreated[i];
    const numberOfDislikes = accountDataGenerator("random", userQuantity, 5);
    // console.log(`Creating ${numberOfDislikes} dislikes for post ${post.id}...`);

    const dislikers = faker.helpers
      .shuffle(Object.values(usersCreated).flat())
      .slice(0, numberOfDislikes);

    for (const disliker of dislikers) {
      dislikeData.push({
        userId: disliker.id,
        postId: post.id,
      });
    }
  }

  await prisma.dislike.createMany({
    data: dislikeData,
    skipDuplicates: true,
  });

  console.log(`...${dislikeData.length} dislikes created!`);
  return dislikeData;
};

// 14. Helper function to create bookmarks
const createBookmarks = async (
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log("Creating bookmarks...");
  const bookmarkData = [];

  for (let i = 0; i < postsCreated.length; i++) {
    const post = postsCreated[i];
    const numberOfBookmarks = accountDataGenerator("random", userQuantity, 5);
    // console.log(
    //   `Creating ${numberOfBookmarks} bookmarks for post ${post.id}...`,
    // );

    const bookmarkers = faker.helpers
      .shuffle(Object.values(usersCreated).flat())
      .slice(0, numberOfBookmarks);

    for (const bookmarker of bookmarkers) {
      bookmarkData.push({
        userId: bookmarker.id,
        postId: post.id,
      });
    }
  }

  await prisma.bookmark.createMany({
    data: bookmarkData,
    skipDuplicates: true,
  });

  console.log(`...${bookmarkData.length} bookmarks created!`);
};

// 15. Helper function to create media
const createMedia = async (postsCreated: any[]) => {
  console.log("Creating media for posts...");
  const mediaData = [];
  const mediaTypes = ["IMAGE", "VIDEO"];
  const getMediaUrl = (type: string) => {
    if (type === "IMAGE") {
      return `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`;
    } else if (type === "VIDEO") {
      // Placeholder video URL (2-second video)
      return "https://www.w3schools.com/html/mov_bbb.mp4#t=0,2";
    }
    return "";
  };

  for (let i = 0; i < postsCreated.length; i++) {
    const post = postsCreated[i];
    const numberOfMedia = faker.number.int({ min: 0, max: 5 });
    // console.log(`Creating media for post ${post.id}...`);

    for (let j = 0; j < numberOfMedia; j++) {
      const type = faker.helpers.arrayElement(mediaTypes);

      mediaData.push({
        type,
        url: getMediaUrl(type),
        postId: post.id,
      });
    }
  }

  await prisma.media.createMany({
    data: mediaData,
    skipDuplicates: true,
  });

  console.log(`...${mediaData.length} pieces of media created!`);
};

// 16. Helper function to create group comments
async function createGroupComments(
  groupPosts: any[],
  createdGroupMembers: any[],
  createdUsers: any[],
): Promise<any[]> {
  console.log("Creating group post comments...");
  const groupCommentsData = [];

  // Create a map of user IDs to user data for quick lookup
  const userMap = new Map();
  for (const user of createdUsers) {
    userMap.set(user.id, user);
  }

  // Loop through the group posts to create comments
  for (let i = 0; i < groupPosts.length; i++) {
    const groupPost = groupPosts[i];
    // console.log(
    //   `Processing group post ${groupPost.id} in group ${groupPost.groupId}...`,
    // );

    // Filter members by groupId
    const members = createdGroupMembers.filter(
      (member) =>
        member.groupId === groupPost.groupId && member.acceptedInvite === true,
    );

    if (members.length === 0) {
      // console.warn(
      //   `No eligible users found for group ${groupPost.groupId}. Skipping comment creation.`,
      // );
      continue;
    }

    const numberOfComments = accountDataGenerator("random", 1, 10);
    // console.log(
    //   `Creating ${numberOfComments} comments on group post ${groupPost.id}...`,
    // );

    for (let j = 0; j < Number(numberOfComments); j++) {
      const groupCommentId = generateIdFromEntropySize(10);
      const selectedMember = faker.helpers.arrayElement(members);
      const user = userMap.get(selectedMember.userId);

      if (!user || !user.id || !user.createdAt) {
        // console.warn(
        //   `Invalid user data for group ${groupPost.groupId}. Skipping comment creation.`,
        // );
        continue;
      }

      const userCreatedAt = new Date(user.createdAt);
      const postCreatedAt = new Date(groupPost.createdAt);
      const earliestCommentDate = new Date(
        Math.max(userCreatedAt.getTime(), postCreatedAt.getTime()),
      );

      const commentCreatedAt = faker.date.between({
        from: earliestCommentDate,
        to: new Date(),
      });

      groupCommentsData.push({
        id: groupCommentId,
        content: `group comment ${faker.lorem.sentence()}`,
        userId: user.id,
        postId: groupPost.id,
        createdAt: commentCreatedAt,
      });
    }
  }

  // Batch create group comments
  await prisma.comment.createMany({
    data: groupCommentsData,
    skipDuplicates: true,
  });

  console.log(`...${groupCommentsData.length} group post comments created!`);

  return groupCommentsData;
}

// 17. Helper function to create notifications for comments
const createCommentNotifications = async (
  commentsCreated: any[],
  allPosts: any[],
) => {
  console.log("Creating comment notifications...");
  const notificationData = [];

  const postMap = new Map(allPosts.map((post: any) => [post.id, post]));

  for (const comment of commentsCreated) {
    const post = postMap.get(comment.postId);

    // console.log(`Creating notification for comment ${comment.id}...`);

    // Ensure the comment and associated post exist
    if (!post) continue;

    notificationData.push({
      recipientId: post.userId, // The user who made the post
      issuerId: comment.userId, // The user who made the comment
      postId: post.id, // Post related to the comment
      type: NotificationType.COMMENT,
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    });
  }

  await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  console.log(`...${notificationData.length} comment notifications created!`);
};

// 18. Helper function to create notifications for likes
const createLikeNotifications = async (createdLikes: any, allPosts: any[]) => {
  console.log("Creating like notifications...");
  const notificationData = [];

  const postMap = new Map(allPosts.map((post: any) => [post.id, post]));

  for (const like of createdLikes) {
    const post = postMap.get(like.postId);
    // console.log(`Creating notification for like ${like.id}...`);

    if (!post) continue;

    notificationData.push({
      recipientId: post.userId, // The user who made the post
      issuerId: like.userId, // The user who liked the post
      postId: post.id, // Post related to the like
      type: NotificationType.LIKE,
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    });
  }

  await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  console.log(`...${notificationData.length} like notifications created!`);
};

// 19. Helper function to create notifications for dislikes
const createDislikeNotifications = async (
  createdDislikes: any,
  allPosts: any[],
) => {
  console.log("Creating dislike notifications...");
  const notificationData = [];

  const postMap = new Map(allPosts.map((post: any) => [post.id, post]));

  for (const dislike of createdDislikes) {
    const post = postMap.get(dislike.postId);
    // console.log(`Creating notification for dislike ${dislike.id}...`);

    if (!post) continue;

    notificationData.push({
      recipientId: post.userId, // The user who made the post
      issuerId: dislike.userId, // The user who disliked the post
      postId: post.id, // Post related to the dislike
      type: NotificationType.DISLIKE,
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    });
  }

  await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  console.log(`...${notificationData.length} dislike notifications created!`);
};

// 20. Helper function to create notifications for follows
const createFollowNotifications = async (createdFollowers: any) => {
  console.log("Creating follow notifications...");
  const notificationData = [];

  for (const follow of createdFollowers) {
    // console.log(`Creating notification for follow ${follow.id}...`);

    notificationData.push({
      recipientId: follow.followingId, // The user being followed
      issuerId: follow.followerId, // The user who followed
      type: NotificationType.FOLLOW,
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    });
  }

  await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  console.log(`...${notificationData.length} follow notifications created!`);
};

// 21. Helper function to create notifications for event attending

const createAttendeeNotifications = async (
  createdAttendees: any,
  createdEvents: any[],
) => {
  console.log("Creating event attendee notifications...");
  const notificationData = [];

  const eventMap = new Map(
    createdEvents.map((event: any) => [event.id, event]),
  );

  for (const attendee of createdAttendees) {
    const event = eventMap.get(attendee.eventId);
    // console.log(`Creating notification for event attendee ${attendee.id}...`);

    if (!event) continue;

    notificationData.push({
      recipientId: event.createdById, // The user who created the event
      issuerId: attendee.userId, // The user who is attending the event
      eventId: event.id, // Event related to the attendee
      type: NotificationType.EVENT_ATTENDEE,
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    });
  }

  await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  console.log(
    `...${notificationData.length} event attendee notifications created!`,
  );
};

// 22. Helper function to create notifications for event cancellations
const createCancellationNotifications = async (
  createdAttendees: any,
  createdEvents: any[],
) => {
  console.log("Creating event cancellation notifications...");
  const notificationData = [];

  const cancelledEvents = createdEvents.filter(
    (event: any) => event.isCancelled,
  );

  const attendeesMap = new Map();
  for (const attendee of createdAttendees) {
    if (!attendeesMap.has(attendee.eventId)) {
      attendeesMap.set(attendee.eventId, []);
    }
    attendeesMap.get(attendee.eventId).push(attendee);
  }

  for (const event of cancelledEvents) {
    const attendees = attendeesMap.get(event.id) || [];

    // console.log(
    //   `Creating notification for cancelled event ${event.id} attendee ${attendee.id}...`,
    // );

    for (const attendee of attendees) {
      notificationData.push({
        recipientId: attendee.userId, // The user who is attending the event
        issuerId: event.createdById, // The user who created the event
        eventId: event.id, // Event related to the cancellation
        type: NotificationType.EVENT_CANCELLED,
        read: faker.datatype.boolean(),
        createdAt: faker.date.recent(),
      });
    }
  }

  await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  console.log(
    `...${notificationData.length} event cancellation notifications created!`,
  );
};

async function main() {
  // 1. Delete existing test users and data
  await deleteTestUsers();

  // 2. Delete test users data from StreamChat
  try {
    console.log("Removing testUsers from StreamChat...");
    await deleteTestUsersFromStreamChat(testUserData.userTypes);
    console.log("...Removed testUsers from StreamChat!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }

  console.log("Start seeding...");

  // 3. Create Users
  const createdUsers = await createUsers(testUserData);

  // 4. Create Groups
  const createdGroups = await createGroups(createdUsers);

  // 5. Create Group Members
  const createdGroupMembers = await createGroupMembers(
    createdUsers,
    createdGroups,
  );

  // 6. Create Public Posts
  const createdPosts = await createPublicPosts(createdUsers);

  // 7. Create Comments
  const createdComments = await createComments(createdUsers, createdPosts);

  // 8. Create Events
  const createdEvents = await createEvents(createdUsers);

  // 9. Create Event Attendees
  const createdAttendees = await createEventAttendees(
    createdUsers,
    createdEvents,
  );

  // 10. Helper function to create follows
  const createdFollowers = await createFollowers(createdUsers);

  // 11. Create Group Posts
  const createdGroupPosts = await createGroupPosts(
    createdGroups,
    createdGroupMembers,
  );

  const allPosts = createdPosts.concat(createdGroupPosts);
  // 12. Create Likes
  const createdLikes = await createLikes(createdUsers, allPosts);

  // 13. Create Dislikes
  const createdDislikes = await createDislikes(createdUsers, allPosts);

  // 14. Create Bookmarks
  await createBookmarks(createdUsers, allPosts);

  // 15. Create Media For Posts
  await createMedia(allPosts);

  // 16. Create Group Comments
  const createdGroupComments = await createGroupComments(
    createdGroupPosts,
    createdGroupMembers,
    createdUsers,
  );

  // 17. Create Comment Notifications
  const allComments = createdComments.concat(createdGroupComments);
  await createCommentNotifications(allComments, allPosts);

  // 18. Create Like Notifications
  await createLikeNotifications(createdLikes, allPosts);

  // 19. Create Dislike Notifications
  await createDislikeNotifications(createdDislikes, allPosts);

  // 20. Create Follow Notifications
  await createFollowNotifications(createdFollowers);

  // 21. Create Attendee Notifications
  await createAttendeeNotifications(createdAttendees, createdEvents);

  // 22. Create Cancellation Notifications
  await createCancellationNotifications(createdAttendees, createdEvents);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
