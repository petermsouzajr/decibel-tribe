import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  generateIdFromEntropySize,
  accountDataGenerator,
} from "../../seedUtils.mjs";

// Input Interfaces
interface UserInput {
  id: string;
  username: string;
  createdAt: Date;
}
interface PostInput {
  id: string;
  userId: string;
  createdAt: Date;
}

// Output Interfaces
export interface CreatedLike {
  // id is likely not needed/used in createMany
  userId: string;
  postId: string;
}
export interface CreatedDislike {
  // id is likely not needed/used in createMany
  userId: string;
  postId: string;
}

export async function seedLikesDislikes(
  prismaClient: PrismaClient,
  createdUsers: UserInput[],
  createdPosts: PostInput[],
): Promise<{ createdLikes: CreatedLike[]; createdDislikes: CreatedDislike[] }> {
  const defaultResult: {
    createdLikes: CreatedLike[];
    createdDislikes: CreatedDislike[];
  } = {
    createdLikes: [],
    createdDislikes: [],
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
  const likesData: Prisma.LikeCreateManyInput[] = [];
  const dislikesData: Prisma.DislikeCreateManyInput[] = [];
  const createdLikesForReturn: CreatedLike[] = [];
  const createdDislikesForReturn: CreatedDislike[] = [];

  const eligibleUsers = createdUsers;
  const eligiblePosts = createdPosts;

  if (eligibleUsers.length === 0 || eligiblePosts.length === 0) {
    console.log(
      "...Not enough users or posts to generate likes/dislikes. Skipping.",
    );
    return { createdLikes: [], createdDislikes: [] };
  }

  for (const post of eligiblePosts) {
    const likerDislikerQuantity = accountDataGenerator("random", 1, 15);
    const potentialLikersDislikers = faker.helpers
      .shuffle(eligibleUsers)
      .filter((u) => u.id !== post.userId); // Exclude post author

    for (
      let i = 0;
      i < likerDislikerQuantity && i < potentialLikersDislikers.length;
      i++
    ) {
      const user = potentialLikersDislikers[i];

      const action = faker.helpers.arrayElement(["LIKE", "DISLIKE", null]);

      if (action === "LIKE") {
        const likeInput: Prisma.LikeCreateManyInput = {
          userId: user.id,
          postId: post.id,
        };
        likesData.push(likeInput);
        createdLikesForReturn.push({ userId: user.id, postId: post.id });
      } else if (action === "DISLIKE") {
        const dislikeInput: Prisma.DislikeCreateManyInput = {
          userId: user.id,
          postId: post.id,
        };
        dislikesData.push(dislikeInput);
        createdDislikesForReturn.push({ userId: user.id, postId: post.id });
      }
    }
  }

  // --- Database Operations ---
  let createdLikesCount = 0;
  let createdDislikesCount = 0;

  try {
    if (likesData.length > 0) {
      const result = await prismaClient.like.createMany({
        data: likesData,
        skipDuplicates: true,
      });
      createdLikesCount = result.count;
      console.log(`...${createdLikesCount} likes created!`);
    } else {
      console.log("...No likes generated to create.");
    }
  } catch (error) {
    console.error("Error creating likes in DB:", error);
    // Continue to dislikes even if likes fail
  }

  try {
    if (dislikesData.length > 0) {
      const result = await prismaClient.dislike.createMany({
        data: dislikesData,
        skipDuplicates: true,
      });
      createdDislikesCount = result.count;
      console.log(`...${createdDislikesCount} dislikes created!`);
    } else {
      console.log("...No dislikes generated to create.");
    }
  } catch (error) {
    console.error("Error creating dislikes in DB:", error);
  }

  // Note: The returned arrays might contain more entries than actually created
  // if skipDuplicates prevents some creations. This mirrors original logic.
  return {
    createdLikes: createdLikesForReturn,
    createdDislikes: createdDislikesForReturn,
  };
}
