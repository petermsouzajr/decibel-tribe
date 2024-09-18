const { PrismaClient, GroupRole, NotificationType } = require("@prisma/client");
const faker = require("@faker-js/faker").faker;
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { hash } = require("argon2");
const Prisma = require("@prisma/client");
const prisma = new PrismaClient();

// prettier-ignore
const userPermissions: any = {
  userVerified:               { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userUnverified:             { canPost: false, canComment: false, canLike: false, canDislike: false, canBookmark: false, canFollow: false },
  userGroupOwner:             { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userGroupInviteSent:        { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userEventNotifications:     { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userNoPosts:                { canPost: false, canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userNoComments:             { canPost: true,  canComment: false, canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyPosts:              { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyComments:           { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyLikes:              { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyDislikes:           { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyBookmarks:          { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyFollowers:          { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyFollowing:          { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyNotifications:      { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userNoFollowers:            { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: false },
  userNoFollowing:            { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: false, canFollow: true  },
  userEventAttendee:          { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyEventAttendees:     { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userEventCreator:           { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userEventCancelled:         { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userManyGroupMemberships:   { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userNoGroupMemberships:     { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userGroupAdmin:             { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userPendingInvite:          { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userGoogleLogin:            { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userWithPendingEmail:       { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userWithEmailVerification:  { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userAfollowingUserB:        { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userBfollowingUserA:        { canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
  userAandBfollowingEachOther:{ canPost: true,  canComment: true,  canLike: true,  canDislike: true,  canBookmark: true,  canFollow: true  },
};

const userQuantity = 2;
const password = "Password1!";
const mediaTypes = ["IMAGE", "VIDEO"];

const random = (min: number, max: number) => faker.number.int({ min, max });

const weightedRandom = (base: number, factor = 1) => {
  return Math.floor(
    base * factor * faker.datatype.float({ min: 0.5, max: 1.5 }),
  );
};

const proportionateRandom = (users: number, factor: number) => {
  return random(
    Math.ceil(users * factor * 0.5),
    Math.ceil(users * factor * 1.5),
  );
};

// AccountData Generator
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

// SeedOptions Interface
interface SeedOptions {
  userTypes: Record<string, number>;
  accountData: Record<string, number | string>;
}

// Generating options
// prettier-ignore
const options: SeedOptions = {
  userTypes: {
    userVerified: userQuantity,
    userUnverified: userQuantity,
    userGroupOwner: userQuantity,
    userGroupInviteSent: userQuantity,
    userEventNotifications: userQuantity,
    userNoComments: userQuantity,
    userNoPosts: userQuantity,
    userManyPosts: userQuantity,
    userManyComments: userQuantity,
    userManyLikes: userQuantity,
    userManyDislikes: userQuantity,
    userManyBookmarks: userQuantity,
    userManyFollowers: userQuantity,
    userManyFollowing: userQuantity,
    userManyNotifications: userQuantity,
    userNoFollowers: userQuantity,
    userNoFollowing: userQuantity,
    userEventAttendee: userQuantity,
    userManyEventAttendees: userQuantity,
    userEventCreator: userQuantity,
    userEventCancelled: userQuantity,
    userManyGroupMemberships: userQuantity,
    userNoGroupMemberships: userQuantity,
    userGroupAdmin: userQuantity,
    userPendingInvite: userQuantity,
    userGoogleLogin: userQuantity,
    userWithPendingEmail: userQuantity,
    userWithEmailVerification: userQuantity,
    userAfollowingUserB: userQuantity,
    userBfollowingUserA: userQuantity,
    userAandBfollowingEachOther: userQuantity,
  },
  accountData: {
    comments:                        accountDataGenerator("random", userQuantity, 24),  // ~24 comments per user
    posts:                           accountDataGenerator("random", userQuantity, 8),   // ~8 posts per user
    groups:                          accountDataGenerator("random", userQuantity, 3),   // ~3 groups per user
    groupComments:                   accountDataGenerator("random", userQuantity, 8),   // ~8 comments per group member
    events:                          accountDataGenerator("random", userQuantity, 2),   // ~2 events per user
    eventAttendees:                  accountDataGenerator("random", userQuantity, 5),   // ~5 attendees per event
    groupMembers:                    accountDataGenerator("random", userQuantity, 8),   // ~8 group members per group
    groupCommentLikes:               accountDataGenerator("random", userQuantity, 28),  // ~28 likes per group comment
    groupCommentDislikes:            accountDataGenerator("random", userQuantity, 12),  // ~12 dislike per group comment
    // groupCommentBookmarks:           accountDataGenerator("random", userQuantity, 0.5), // ~0.5 bookmarks per comment
    // groupCommentNotifications:       accountDataGenerator("random", userQuantity, 3),   // ~3 notifications per group comment
    // groupCommentMedia:               accountDataGenerator("random", userQuantity, 1),   // ~1 media per group comment
    // groupNotifications:              accountDataGenerator("random", userQuantity, 2),   // ~2 notifications per group
    // groupMedia:                      accountDataGenerator("random", userQuantity, 0.7), // ~0.7 media per group
    groupPosts:                      accountDataGenerator("random", userQuantity, 50),  // ~50 posts per group
    groupPostLikes:                  accountDataGenerator("random", userQuantity, 18),  // ~18 likes per group post
    groupPostDislikes:               accountDataGenerator("random", userQuantity, 6),   // ~6 dislike per group post
    groupPostBookmarks:              accountDataGenerator("random", userQuantity, 0.5), // ~0.5 bookmarks per group post
    // groupPostNotifications:          accountDataGenerator("random", userQuantity, 2),   // ~2 notifications per group post
    groupPostMedia:                  accountDataGenerator("random", userQuantity, 0.7), // ~0.7 media per group post
    groupPostComments:               accountDataGenerator("random", userQuantity, 25),  // ~25 comments per group post
    // groupPostCommentLikes:           accountDataGenerator("random", userQuantity, 4),   // ~4 likes per comment
    // groupPostCommentDislikes:        accountDataGenerator("random", userQuantity, 1),   // ~1 dislike per comment
    groupPostCommentBookmarks:       accountDataGenerator("random", userQuantity, 0.5), // ~0.5 bookmarks per comment
    // groupPostCommentNotifications:   accountDataGenerator("random", userQuantity, 3),   // ~3 notifications per comment
    // groupPostCommentMedia:           accountDataGenerator("random", userQuantity, 1),   // ~1 media per comment
  },
};

// Helper function to filter users by capability
const filterUsersByCapability = (
  usersCreated: Record<string, any[]>,
  capability: string,
) => {
  return Object.keys(usersCreated)
    .filter((userType) => userPermissions[userType]?.[capability])
    .flatMap((userType) => usersCreated[userType]);
};
// Filter users who are allowed to create posts
// const postUsers = filterUsersByCapability(usersCreated, "canPost");
//////////

// 1. Helper function to create users
const createUsers = async (options: SeedOptions) => {
  console.log(`Creating ${userQuantity * 2} users...`);

  const { userTypes } = options;
  const usersCreated: Record<string, any[]> = {}; // Store users by type
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  for (const [userType, count] of Object.entries(userTypes)) {
    const users = [];

    for (let i = 0; i < count; i++) {
      // Format username as `testUserType1`, `testUserType2`, etc.
      const username = `test${userType.charAt(0).toUpperCase() + userType.slice(1)}${i + 1}`;
      const email = `${username.toLowerCase()}@example.com`;

      // Set user as verified if the type includes "Verified"
      const isVerified = userType.includes("Verified");

      console.log("Creating user:", username);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          displayName: username,
          passwordHash: passwordHash,
          isVerified,
          avatarUrl: faker.image.avatar(),
          bio: faker.lorem.sentence(),
        },
      });

      users.push(user);
    }
    usersCreated[userType] = users;
  }

  return usersCreated;
};

// 2. Helper function to create groups
const createGroups = async (
  options: SeedOptions,
  usersCreated: Record<string, any[]>,
) => {
  console.log(`Creating ${options.accountData.groups} groups...`);

  const groupsCreated = [];

  for (let i = 0; i < Number(options.accountData.groups); i++) {
    // Randomly pick a user as the group owner
    const groupOwner = faker.helpers.arrayElement(usersCreated.userGroupOwner);

    const group = await prisma.group.create({
      data: {
        name: faker.company.name(),
        description: faker.lorem.sentence(),
        ownerId: groupOwner.id,
      },
    });

    groupsCreated.push(group);
  }

  return groupsCreated;
};

// 3. Helper function to create group members
const createGroupMembers = async (
  usersCreated: Record<string, any[]>,
  groupsCreated: any[],
) => {
  console.log("Creating group members...");

  const groupMembersData = [];

  // Iterate through the groups created
  for (const group of groupsCreated) {
    const numberOfMembers = faker.number.int({ min: 1, max: 20 });

    // Shuffle and select a subset of created users to become group members
    const members = faker.helpers
      .shuffle(Object.values(usersCreated).flat())
      .slice(0, numberOfMembers);

    for (const member of members) {
      // Avoid adding the group owner as a member
      if (member.id === group.ownerId) continue;

      groupMembersData.push({
        userId: member.id,
        groupId: group.id,
        role: faker.helpers.arrayElement([GroupRole.MEMBER, GroupRole.ADMIN]),
        acceptedInvite: faker.datatype.boolean(),
      });
    }
  }

  // Batch create group members
  await prisma.groupMember.createMany({
    data: groupMembersData,
    skipDuplicates: true,
  });
};

// 4. Helper function to create public posts
const createPublicPosts = async (
  options: SeedOptions,
  usersCreated: Record<string, any[]>,
) => {
  console.log(`Creating ${options.accountData.posts} public posts...`);

  const postsCreated = [];

  for (let i = 0; i < Number(options.accountData.posts); i++) {
    const post = await prisma.post.create({
      data: {
        content: faker.lorem.sentence(),
        userId: faker.helpers.arrayElement(usersCreated.userVerified).id,
      },
    });

    postsCreated.push(post);
  }

  return postsCreated;
};

// 5. Helper function to create public comments
const createComments = async (
  options: SeedOptions,
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log(`Creating ${options.accountData.comments} comments...`);

  const commentsCreated = [];

  for (let i = 0; i < Number(options.accountData.comments); i++) {
    const comment = await prisma.comment.create({
      data: {
        content: faker.lorem.sentence(),
        userId: faker.helpers.arrayElement(usersCreated.userVerified).id,
        postId: faker.helpers.arrayElement(postsCreated).id,
      },
    });

    commentsCreated.push(comment);
  }

  return commentsCreated;
};

// 6. Helper function to create events
const createEvents = async (
  options: SeedOptions,
  usersCreated: Record<string, any[]>,
) => {
  console.log(`Creating ${options.accountData.events} events...`);

  const eventsCreated = [];

  for (let i = 0; i < Number(options.accountData.events); i++) {
    const event = await prisma.event.create({
      data: {
        title: faker.lorem.words(),
        location: faker.location.city(),
        description: faker.lorem.paragraph(),
        url: faker.internet.url(),
        when: faker.date.soon(90).toISOString(),
        startTime: faker.date.future().toISOString().slice(11, 16),
        endTime: faker.date.future().toISOString().slice(11, 16),
        performers: faker.helpers
          .shuffle(["Performer1", "Performer2", "Performer3"])
          .slice(0, 2),
        createdById: faker.helpers.arrayElement(usersCreated.userVerified).id,
        isCancelled: faker.datatype.boolean(),
        status: faker.helpers.arrayElement(["DRAFT", "ACTIVE", "COMPLETED"]),
        visibility: faker.helpers.arrayElement(["PUBLIC", "PRIVATE"]),
      },
    });

    eventsCreated.push(event);
  }

  return eventsCreated;
};

// 7. Helper function to create event attendees
const createEventAttendees = async (
  options: SeedOptions,
  usersCreated: Record<string, any[]>,
  eventsCreated: any[],
) => {
  console.log(
    `Creating ${options.accountData.eventAttendees} event attendees...`,
  );

  const eventAttendeesData = [];

  for (const event of eventsCreated) {
    const numberOfAttendees = faker.number.int({ min: 1, max: 50 });

    const attendees = faker.helpers
      .shuffle(Object.values(usersCreated).flat())
      .slice(0, numberOfAttendees);

    for (const attendee of attendees) {
      eventAttendeesData.push({
        userId: attendee.id,
        eventId: event.id,
      });
    }
  }

  await prisma.eventAttendee.createMany({
    data: eventAttendeesData,
    skipDuplicates: true,
  });
};

// 8. Helper function to create likes

const createLikes = async (
  options: SeedOptions,
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log("Creating likes...");

  const likeData = [];

  for (let i = 0; i < Number(options.accountData.posts); i++) {
    const post = postsCreated[i];
    const numberOfLikes = faker.number.int({ min: 0, max: 20 });

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
};

// 9. Helper function to create dislikes

const createDislikes = async (
  options: SeedOptions,
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log("Creating dislikes...");

  const dislikeData = [];

  for (let i = 0; i < Number(options.accountData.posts); i++) {
    const post = postsCreated[i];
    const numberOfDislikes = faker.number.int({ min: 0, max: 10 });

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
};

// 10. Helper function to create bookmarks

const createBookmarks = async (
  options: SeedOptions,
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log("Creating bookmarks...");

  const bookmarkData = [];

  for (let i = 0; i < Number(options.accountData.posts); i++) {
    const post = postsCreated[i];
    const numberOfBookmarks = faker.number.int({ min: 0, max: 10 });

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
};

// 11. Helper function to create notifications

const createNotifications = async (
  commentsCreated: any[],
  usersCreated: Record<string, any[]>,
  postsCreated: any[],
) => {
  console.log("Creating notifications...");

  const notificationData = [];

  for (const comment of commentsCreated) {
    const commentWithPost = await prisma.comment.findUnique({
      where: { id: comment.id },
      include: { post: true },
    });

    // Ensure the comment and associated post exist
    if (!commentWithPost?.post) continue;

    notificationData.push({
      recipientId: commentWithPost.post.userId, // The user who made the post
      issuerId: faker.helpers.arrayElement(Object.values(usersCreated).flat())
        .id, // A random user issuing the notification
      postId: commentWithPost.post.id, // Post related to the comment
      type: faker.helpers.arrayElement([
        NotificationType.LIKE,
        NotificationType.COMMENT,
        NotificationType.FOLLOW,
      ]),
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    });
  }

  // Create the notifications
  await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });
};

// 12. Helper function to create media

const createMedia = async (options: SeedOptions, postsCreated: any[]) => {
  console.log("Creating media...");

  const mediaData = [];

  for (let i = 0; i < Number(options.accountData.posts); i++) {
    const post = postsCreated[i];
    const numberOfMedia = faker.number.int({ min: 0, max: 5 });

    for (let j = 0; j < numberOfMedia; j++) {
      mediaData.push({
        type: faker.helpers.arrayElement(mediaTypes),
        url: faker.image.avatar(),
        postId: post.id,
      });
    }
  }

  await prisma.media.createMany({
    data: mediaData,
    skipDuplicates: true,
  });
};

// 13. Helper function to create group comments

async function createGroupComments(
  options: SeedOptions,
  groupPosts: any[],
  createdUsers: Record<string, any[]>,
): Promise<any[]> {
  console.log(
    `Creating ${options.accountData.groupComments} group comments...`,
  );

  const createdGroupComments = [];

  for (let i = 0; i < Number(options.accountData.groupComments); i++) {
    const comment = await prisma.comment.create({
      data: {
        content: faker.lorem.sentence(),
        userId: faker.helpers.arrayElement(Object.values(createdUsers).flat())
          .id,
        postId: faker.helpers.arrayElement(groupPosts).id,
      },
    });

    createdGroupComments.push(comment);
  }

  return createdGroupComments; // Return the created comments
}

// 14. Helper function to create group comment likes

const createGroupCommentLikes = async (
  options: SeedOptions,
  groupComments: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group comment likes...");

  const groupCommentLikeData = [];

  for (let i = 0; i < Number(options.accountData.groupComments); i++) {
    const groupComment = groupComments[i];

    groupCommentLikeData.push({
      userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
      postId: groupComment.postId,
    });
  }

  await prisma.like.createMany({
    data: groupCommentLikeData,
    skipDuplicates: true,
  });
};

// 15. Helper function to create group comment dislikes

const createGroupCommentDislikes = async (
  options: SeedOptions,
  groupComments: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group comment dislikes...");

  const groupCommentDislikeData = [];

  for (let i = 0; i < Number(options.accountData.groupComments); i++) {
    const groupComment = groupComments[i];

    groupCommentDislikeData.push({
      userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
      postId: groupComment.postId,
    });
  }

  await prisma.dislike.createMany({
    data: groupCommentDislikeData,
    skipDuplicates: true,
  });
};

// 16.  Helper function to create group comment bookmarks

const createGroupCommentBookmarks = async (
  options: SeedOptions,
  groupComments: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group comment bookmarks...");

  const groupCommentBookmarkData = [];

  for (let i = 0; i < Number(options.accountData.groupComments); i++) {
    const groupComment = groupComments[i];

    groupCommentBookmarkData.push({
      userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
      postId: groupComment.postId,
    });
  }

  await prisma.bookmark.createMany({
    data: groupCommentBookmarkData,
    skipDuplicates: true,
  });
};

// 17. Helper function to create group comment notifications

const createGroupCommentNotifications = async (
  options: SeedOptions,
  groupComments: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group comment notifications...");

  const groupCommentNotificationData = [];

  for (let i = 0; i < Number(options.accountData.groupComments); i++) {
    const groupComment = groupComments[i];

    groupCommentNotificationData.push({
      recipientId: faker.helpers.arrayElement(
        Object.values(usersCreated).flat(),
      ).id,
      issuerId: faker.helpers.arrayElement(Object.values(usersCreated).flat())
        .id,
      postId: faker.helpers.arrayElement(Object.values(groupComment).flat()).id,
      type: faker.helpers.arrayElement([
        NotificationType.LIKE,
        NotificationType.COMMENT,
      ]),
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    });
  }

  await prisma.notification.createMany({
    data: groupCommentNotificationData,
    skipDuplicates: true,
  });
};

// // 18. Helper function to create group comment media ////fix

// const createGroupCommentMedia = async (
//   options: SeedOptions,
//   groupComments: any[],
// ) => {
//   console.log("Creating group comment media...");

//   const groupCommentMediaData = [];

//   for (let i = 0; i < Number(options.accountData.groupComments); i++) {
//     const groupComment = groupComments[i];

//     groupCommentMediaData.push({
//       type: faker.helpers.arrayElement(mediaTypes),
//       url: faker.image.imageUrl(),
//       postId: groupComment.id,
//     });
//   }

//   await prisma.media.createMany({
//     data: groupCommentMediaData,
//     skipDuplicates: true,
//   });
// };

// 21. Helper function to create group posts

const createGroupPosts = async (
  options: SeedOptions,
  groupsCreated: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log(`Creating ${options.accountData.groupPosts} group posts...`);

  const groupPostsCreated = [];

  for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
    const group = faker.helpers.arrayElement(groupsCreated);

    const groupPost = await prisma.post.create({
      data: {
        content: faker.lorem.sentence(),
        userId: faker.helpers.arrayElement(Object.values(usersCreated).flat())
          .id, // Selecting a random user from the users created
        groupId: group.id, // Assigning the group ID
      },
    });

    groupPostsCreated.push(groupPost);
  }

  return groupPostsCreated;
};

// 22. Helper function to create group post likes

const createGroupPostLikes = async (
  options: SeedOptions,
  groupPosts: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group post likes...");

  const groupPostLikeData = [];

  for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
    const groupPost = groupPosts[i];

    groupPostLikeData.push({
      userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
      postId: groupPost.id,
    });
  }

  await prisma.like.createMany({
    data: groupPostLikeData,
    skipDuplicates: true,
  });
};

// 23. Helper function to create group post dislikes

const createGroupPostDislikes = async (
  options: SeedOptions,
  groupPosts: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group post dislikes...");

  const groupPostDislikeData = [];

  for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
    const groupPost = groupPosts[i];

    groupPostDislikeData.push({
      userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
      postId: groupPost.id,
    });
  }

  await prisma.dislike.createMany({
    data: groupPostDislikeData,
    skipDuplicates: true,
  });
};

// 24. Helper function to create group post bookmarks

const createGroupPostBookmarks = async (
  options: SeedOptions,
  groupPosts: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group post bookmarks...");

  const groupPostBookmarkData = [];

  for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
    const groupPost = groupPosts[i];

    groupPostBookmarkData.push({
      userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
      postId: groupPost.id,
    });
  }

  await prisma.bookmark.createMany({
    data: groupPostBookmarkData,
    skipDuplicates: true,
  });
};

// 25. Helper function to create group post notifications

const createGroupPostNotifications = async (
  options: SeedOptions,
  groupPosts: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group post notifications...");

  const groupPostNotificationData = [];

  for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
    const groupPost = groupPosts[i];

    groupPostNotificationData.push({
      recipientId: groupPost.userId,
      issuerId: faker.helpers.arrayElement(Object.values(usersCreated).flat())
        .id,
      postId: groupPost.id,
      type: faker.helpers.arrayElement([
        NotificationType.LIKE,
        NotificationType.COMMENT,
      ]),
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    });
  }

  await prisma.notification.createMany({
    data: groupPostNotificationData,
    skipDuplicates: true,
  });
};

// 26. Helper function to create group post media

const createGroupPostMedia = async (
  options: SeedOptions,
  groupPosts: any[],
) => {
  console.log("Creating group post media...");

  const groupPostMediaData = [];

  for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
    const groupPost = groupPosts[i];
    const numberOfMedia = faker.number.int({ min: 0, max: 5 });

    for (let j = 0; j < numberOfMedia; j++) {
      groupPostMediaData.push({
        type: faker.helpers.arrayElement(mediaTypes),
        url: faker.image.avatar(),
        postId: groupPost.id,
      });
    }
  }

  await prisma.media.createMany({
    data: groupPostMediaData,
    skipDuplicates: true,
  });
};

// 27. Helper function to create group post comments

const createGroupPostComments = async (
  options: SeedOptions,
  groupPosts: any[],
  usersCreated: Record<string, any[]>,
) => {
  console.log("Creating group post comments...");

  const groupPostCommentsData = [];

  for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
    const post = groupPosts[i];

    groupPostCommentsData.push({
      content: faker.lorem.sentence(),
      userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
      postId: post.id,
    });
  }

  await prisma.comment.createMany({
    data: groupPostCommentsData,
    skipDuplicates: true,
  });
};

// // 28. Helper function to create group post comment likes

// const createGroupPostCommentLikes = async (
//   options: SeedOptions,
//   groupComments: any[],
//   usersCreated: Record<string, any[]>,
// ) => {
//   console.log("Creating group post comment likes...");

//   const groupPostCommentLikeData = [];

//   for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
//     const groupComment = groupComments[i];

//     groupPostCommentLikeData.push({
//       userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
//       postId: groupComment.id,
//     });
//   }

//   await prisma.like.createMany({
//     data: groupPostCommentLikeData,
//     skipDuplicates: true,
//   });
// };

// // 29. Helper function to create group post comment dislikes

// const createGroupPostCommentDislikes = async (
//   options: SeedOptions,
//   groupComments: any[],
//   usersCreated: Record<string, any[]>,
// ) => {
//   console.log("Creating group post comment dislikes...");

//   const groupPostCommentDislikeData = [];

//   for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
//     const groupComment = groupComments[i];

//     groupPostCommentDislikeData.push({
//       userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
//       postId: groupComment.id,
//     });
//   }

//   await prisma.dislike.createMany({
//     data: groupPostCommentDislikeData,
//     skipDuplicates: true,
//   });
// };

// // 30. Helper function to create group post comment bookmarks

// const createGroupPostCommentBookmarks = async (
//   options: SeedOptions,
//   groupComments: any[],
//   usersCreated: Record<string, any[]>,
// ) => {
//   console.log("Creating group post comment bookmarks...");

//   const groupPostCommentBookmarkData = [];

//   for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
//     const groupComment = groupComments[i];

//     groupPostCommentBookmarkData.push({
//       userId: faker.helpers.arrayElement(Object.values(usersCreated).flat()).id,
//       postId: groupComment.id,
//     });
//   }

//   await prisma.bookmark.createMany({
//     data: groupPostCommentBookmarkData,
//     skipDuplicates: true,
//   });
// };

// 31. Helper function to create group post comment notifications

// const createGroupPostCommentNotifications = async (
//   options: SeedOptions,
//   groupComments: any[],
//   usersCreated: Record<string, any[]>,
// ) => {
//   console.log("Creating group post comment notifications...");

//   const groupPostCommentNotificationData = [];

//   for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
//     const groupComment = groupComments[i];

//     groupPostCommentNotificationData.push({
//       recipientId: faker.helpers.arrayElement(
//         Object.values(usersCreated).flat(),
//       ).id,
//       issuerId: faker.helpers.arrayElement(Object.values(usersCreated).flat())
//         .id,
//       postId: groupComment.id,
//       type: faker.helpers.arrayElement([
//         NotificationType.LIKE,
//         NotificationType.COMMENT,
//       ]),
//       read: faker.datatype.boolean(),
//       createdAt: faker.date.recent(),
//     });
//   }

//   await prisma.notification.createMany({
//     data: groupPostCommentNotificationData,
//     skipDuplicates: true,
//   });
// };

// // 32. Helper function to create group post comment media

// const createGroupPostCommentMedia = async (
//   options: SeedOptions,
//   groupComments: any[],
// ) => {
//   console.log("Creating group post comment media...");

//   const groupPostCommentMediaData = [];

//   for (let i = 0; i < Number(options.accountData.groupPosts); i++) {
//     const groupComment = groupComments[i];

//     groupPostCommentMediaData.push({
//       type: faker.helpers.arrayElement(mediaTypes),
//       url: faker.image.avatar(),
//       postId: groupComment.id,
//     });
//   }

//   await prisma.media.createMany({
//     data: groupPostCommentMediaData,
//     skipDuplicates: true,
//   });
// };

async function main() {
  async function deleteTestUsers() {
    console.log("Clearing database ...");

    // List of test usernames you want to delete
    const partialUsernames = Object.keys(options.userTypes).map(
      (userType) =>
        `test${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
    );

    try {
      // Delete users whose usernames contain any of the partialUsernames
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

      console.log(`${userIds.length} test users found!`);
      // Delete related records
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

      // Delete users
      const deleteUsers = await prisma.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });

      console.log(`${userIds.length} test users deleted successfully!`);
    } catch (error) {
      console.error("Error deleting test users:", error);
    } finally {
      await prisma.$disconnect();
    }
  }

  // (async () => {
  // await deleteTestUsers();
  // await new Promise((resolve) => setTimeout(resolve, 60000));

  // add a delay to ensure the database is cleared before seeding, one minute
  // })();

  await deleteTestUsers();
  await new Promise((resolve) => setTimeout(resolve, 60000));

  console.log("Start seeding ...");

  // 1. Create Users
  const createdUsers = await createUsers(options);

  // 2. Create Groups
  const createdGroups = await createGroups(options, createdUsers);

  // 3. Create Group Members
  await createGroupMembers(createdUsers, createdGroups);

  // 4. Create Public Posts
  const createdPosts = await createPublicPosts(options, createdUsers);

  // 5. Create Comments
  const createdComments = await createComments(
    options,
    createdUsers,
    createdPosts,
  );

  // 6. Create Events
  const createdEvents = await createEvents(options, createdUsers);

  // 7. Create Event Attendees
  await createEventAttendees(options, createdUsers, createdEvents);

  // 8. Create Likes
  await createLikes(options, createdUsers, createdPosts);

  // 9. Create Dislikes
  await createDislikes(options, createdUsers, createdPosts);

  // 10. Create Bookmarks
  await createBookmarks(options, createdUsers, createdPosts);

  // 11. Create Notifications
  await createNotifications(createdComments, createdUsers, createdPosts);

  // 12. Create Media For Posts
  await createMedia(options, createdPosts);

  // 21. Create Group Posts
  const createdGroupPosts = await createGroupPosts(
    options,
    createdGroups,
    createdUsers,
  );

  const createdGroupComments = await createGroupComments(
    options,
    createdGroupPosts,
    createdUsers,
  );

  // 14. Create Group Comment Likes
  await createGroupCommentLikes(options, createdGroupComments, createdUsers);

  // 15. Create Group Comment Dislikes
  await createGroupCommentDislikes(options, createdGroupComments, createdUsers);

  // 16. Create Group Comment Bookmarks
  await createGroupCommentBookmarks(
    options,
    createdGroupComments,
    createdUsers,
  );

  // 17. Create Group Comment Notifications
  await createGroupCommentNotifications(
    options,
    createdGroupComments,
    createdUsers,
  );

  // // 18. Create Group Comment Media
  // await createGroupCommentMedia(options, createdGroupComments);

  // 22. Create Group Post Likes
  await createGroupPostLikes(options, createdGroupPosts, createdUsers);

  // 23. Create Group Post Dislikes
  await createGroupPostDislikes(options, createdGroupPosts, createdUsers);

  // 24. Create Group Post Bookmarks
  await createGroupPostBookmarks(options, createdGroupPosts, createdUsers);

  // 25. Create Group Post Notifications
  await createGroupPostNotifications(options, createdGroupPosts, createdUsers);

  // 26. Create Group Post Media
  await createGroupPostMedia(options, createdGroupPosts);

  // 27. Create Group Post Comments
  await createGroupPostComments(options, createdGroupPosts, createdUsers);

  //   // 28. Create Group Post Comment Likes
  //   await createGroupPostCommentLikes(
  //     options,
  //     createdGroupComments,
  //     createdUsers,
  //   );

  //   // 29. Create Group Post Comment Dislikes
  //   await createGroupPostCommentDislikes(
  //     options,
  //     createdGroupComments,
  //     createdUsers,
  //   );

  //   // 30. Create Group Post Comment Bookmarks
  //   await createGroupPostCommentBookmarks(
  //     options,
  //     createdGroupComments,
  //     createdUsers,
  //   );

  //   // 31. Create Group Post Comment Notifications
  //   await createGroupPostCommentNotifications(
  //     options,
  //     createdGroupComments,
  //     createdUsers,
  //   );

  //   // 32. Create Group Post Comment Media
  //   await createGroupPostCommentMedia(options, createdGroupComments);
  //   console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
