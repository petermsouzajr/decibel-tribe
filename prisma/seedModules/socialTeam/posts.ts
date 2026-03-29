import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  random,
  generateIdFromEntropySize,
  accountDataGenerator,
  cypressEnv,
  // prisma is passed as an argument
} from "../../seedUtils.js";

// Interface for the user data expected
interface UserInput {
  id: string;
  username: string; // Needed for specific user checks (e.g., UserManyPosts)
  isEmailVerified: boolean;
  createdAt: Date;
}

// Interface for the data returned by this module
export interface CreatedPost {
  id: string;
  userId: string;
  groupId: string | null; // Keep track if it was a group post
  createdAt: Date;
}

export async function seedPublicPosts(
  prismaClient: PrismaClient,
  createdUsers: UserInput[],
): Promise<CreatedPost[]> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedPublicPosts.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for public post creation. Skipping.");
    return [];
  }

  console.log("Creating public posts...");
  const postsData: Prisma.PostCreateManyInput[] = [];
  const createdPostsForReturn: CreatedPost[] = [];

  // Filter users: Eligible users are verified and not the 'noPosts' type
  const eligibleUsers = createdUsers.filter(
    (user) => user.isEmailVerified && !user.username.includes("noPosts"),
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
        from: new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000),
        to: new Date(),
      });
      const postInput: Prisma.PostCreateManyInput = {
        id: postId,
        content: `public post ${faker.lorem.sentence()}`,
        userId: user.id,
        groupId: null,
        createdAt: createdAtDate,
      };
      postsData.push(postInput);
      createdPostsForReturn.push({
        id: postId,
        userId: user.id,
        groupId: null,
        createdAt: createdAtDate,
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
      skipDuplicates: true,
    });
    console.log(`...${postsData.length} public posts created!`);
  } catch (error) {
    console.error("Error creating public posts in DB:", error);
    return []; // Return empty on DB error
  }

  return createdPostsForReturn;
}
