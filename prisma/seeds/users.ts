// import type { TestUserData } from "../seed";

// const { PrismaClient, GroupRole, NotificationType } = require("@prisma/client");
// const prisma = new PrismaClient();
// const { hash } = require("argon2");
// const faker = require("@faker-js/faker").faker;
// const { StreamChat } = require("stream-chat");

// // export interface TestUserData {
// //   quantityOfEachUser: number;
// //   password: string;
// //   userTypess: string[];
// // }

// export const createUsers = async (testUserData: TestUserData) => {
//   const streamChatClient = StreamChat.getInstance(
//     "uc9cbnbm2pug",
//     "svh5e63mqqkq9gwp9zdd5gnmcyqtgrhkxejmbr6sgrraph9v56v2n8pdh5yds4nx",
//   );

//   const quantity = testUserData.quantityOfEachUser;
//   const userTypes = testUserData.userTypess;
//   const password = testUserData.password;

//   console.log(`Creating ${testUserData.userTypess.length} users...`);

//   const usersCreated: Record<string, any[]> = {};
//   const passwordHash = await hash(testUserData.password, {
//     memoryCost: 19456,
//     timeCost: 2,
//     outputLen: 32,
//     parallelism: 1,
//   });

//   const allUsers = [];

//   for (const userType of userTypes) {
//     const users = [];

//     for (let i = 0; i < quantity; i++) {
//       // Format username as `testUserType1`, `testUserType2`, etc.
//       const username = `testUser${userType.charAt(0).toUpperCase() + userType.slice(1)}${quantity > 1 ? i + 1 : ""}`;
//       const email = `${username.toLowerCase()}@example.com`;
//       const isGoogleLoginUser = username.includes("GoogleLogin");
//       const googleId = isGoogleLoginUser
//         ? `${faker.string.numeric(10)}${faker.string.alphanumeric(10)}`
//         : null;

//       const userPasswordHash = isGoogleLoginUser ? null : passwordHash;

//       // Set user as verified if the type does not include "unverified"
//       const isVerified = !userType.includes("unverified");
//       const hasAvatar = !userType.includes("noAvatar") && Math.random() < 0.8; // 80% chance of having an avatar

//       let avatarUrl = hasAvatar
//         ? `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`
//         : null;

//       const isNoBioUser = username.includes("NoBio");
//       const bio = isNoBioUser ? null : faker.lorem.sentence();
//       const randomDate = faker.date.between({
//         from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
//         to: new Date(),
//       });

//       users.push({
//         username,
//         email,
//         displayName: username,
//         passwordHash: userPasswordHash,
//         isVerified,
//         avatarUrl,
//         googleId,
//         bio,
//         createdAt: randomDate,
//       });
//     }

//     await prisma.user.createMany({
//       data: users,
//       skipDuplicates: true,
//     });

//     // Fetch the created users to get their IDs
//     const fetchedUsers = await prisma.user.findMany({
//       where: {
//         username: {
//           in: users.map((user) => user.username),
//         },
//       },
//     });

//     usersCreated[userType] = fetchedUsers;
//     allUsers.push(...fetchedUsers);
//   }

//   console.log(`Adding ${allUsers.length} users to StreamChat...`);

//   // Add users to StreamChat in bulk
//   const streamChatUsers = allUsers.map((user) => ({
//     id: user.id,
//     name: user.displayName,
//     image: user.avatarUrl,
//     email: user.email,
//   }));

//   try {
//     await streamChatClient.upsertUsers(streamChatUsers);
//     console.log(`${allUsers.length} new users added to StreamChat!`);
//   } catch (error) {
//     console.error(
//       `Failed to add users to StreamChat:`,
//       (error as Error).message,
//     );
//   }

//   return usersCreated;
// };

// ////
// export interface TestUserData {
//   quantityOfEachUser: number;
//   password: string;
//   userTypess: string[];
// }

// // prettier-ignore
// const testUserData: TestUserData = {
//   quantityOfEachUser: userQuantity,
//   password: "Password1!",
//   userTypess: [
//     'verified', // Verified users
//     'unverified', // Unverified users
//     'groupOwner', // Group owners
//     'groupInviteSent', // Send only invites so user can accept or reject
//     'eventNotifications', // Received event notifications and clicks on them to check link
//     'noComments', // Post with no comments
//     'noPosts', // User with no posts
//     'manyPosts', // User with many posts
//     'manyComments', // User with many comments
//     'manyLikes', // User with many likes
//     'manyDislikes', // User with many dislikes
//     'manyBookmarks', // User with many bookmarks
//     'manyFollowers', // User with many followers
//     'manyFollowing', // User with many following
//     'manyNotifications', // User with many unread notifications
//     'noFollowers', // User with no followers
//     'noFollowing', // User with no following
//     'eventAttendee', // User attending an event
//     'manyEventAttendees', // User owns an event with many attendees
//     'eventCreator', // User creates an event has no attendees
//     'eventCancelled', // User creates an event and cancels it
//     'manyGroupMemberships', // User is a member of many groups
//     'noGroupMemberships', // User is not a member of any group
//     'groupAdmin', // User is an admin of a group
//     'pendingInvite', // User has a pending invite to a group
//     'googleLogin', // User logs in with Google, no password
//     'withPendingEmail', // User has a pending email verification
//     'aFollowingUserB',
//     'bFollowingUserA',
//     'cAndDFollowingEachOther',
//     'noAvatar',
//     'noBio',
//     'fMemberOfGroupG',
//     'hNotMemberOfGroupG',
//     'iMemberOfGroupG',
//     'gOwnerOfGroup',
//   ]
// };

// // 1. Helper function to create users
// const createUsers = async (testUserData: TestUserData) => {
//   const streamChatClient = StreamChat.getInstance(
//     "uc9cbnbm2pug",
//     "svh5e63mqqkq9gwp9zdd5gnmcyqtgrhkxejmbr6sgrraph9v56v2n8pdh5yds4nx",
//   );

//   const quantity = testUserData.quantityOfEachUser;
//   const userTypes = testUserData.userTypess;
//   const password = testUserData.password;

//   console.log(`Creating ${testUserData.userTypess.length} users...`);

//   const usersCreated: Record<string, any[]> = {};
//   const passwordHash = await hash(password, {
//     memoryCost: 19456,
//     timeCost: 2,
//     outputLen: 32,
//     parallelism: 1,
//   });

//   const allUsers = [];

//   for (const userType of userTypes) {
//     const users = [];

//     for (let i = 0; i < quantity; i++) {
//       // Format username as `testUserType1`, `testUserType2`, etc.
//       const username = `testUser${userType.charAt(0).toUpperCase() + userType.slice(1)}${quantity > 1 ? i + 1 : ""}`;
//       const email = `${username.toLowerCase()}@example.com`;
//       const isGoogleLoginUser = username.includes("GoogleLogin");
//       const googleId = isGoogleLoginUser
//         ? `${faker.string.numeric(10)}${faker.string.alphanumeric(10)}`
//         : null;

//       const userPasswordHash = isGoogleLoginUser ? null : passwordHash;

//       // Set user as verified if the type does not include "unverified"
//       const isVerified = !userType.includes("unverified");
//       const hasAvatar = !userType.includes("noAvatar") && Math.random() < 0.8; // 80% chance of having an avatar

//       let avatarUrl = hasAvatar
//         ? `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`
//         : null;

//       const isNoBioUser = username.includes("NoBio");
//       const bio = isNoBioUser ? null : faker.lorem.sentence();
//       const randomDate = faker.date.between({
//         from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
//         to: new Date(),
//       });

//       users.push({
//         username,
//         email,
//         displayName: username,
//         passwordHash: userPasswordHash,
//         isVerified,
//         avatarUrl,
//         googleId,
//         bio,
//         createdAt: randomDate,
//       });
//     }

//     await prisma.user.createMany({
//       data: users,
//       skipDuplicates: true,
//     });

//     // Fetch the created users to get their IDs
//     const fetchedUsers = await prisma.user.findMany({
//       where: {
//         username: {
//           in: users.map((user) => user.username),
//         },
//       },
//     });

//     usersCreated[userType] = fetchedUsers;
//     allUsers.push(...fetchedUsers);
//   }

//   console.log(`Adding ${allUsers.length} users to StreamChat...`);

//   // Add users to StreamChat in bulk
//   const streamChatUsers = allUsers.map((user) => ({
//     id: user.id,
//     name: user.displayName,
//     image: user.avatarUrl,
//     email: user.email,
//   }));

//   try {
//     await streamChatClient.upsertUsers(streamChatUsers);
//     console.log(`${allUsers.length} new users added to StreamChat!`);
//   } catch (error) {
//     console.error(
//       `Failed to add users to StreamChat:`,
//       (error as Error).message,
//     );
//   }

//   return usersCreated;
// };
