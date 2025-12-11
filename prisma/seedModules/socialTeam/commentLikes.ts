import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  accountDataGenerator,
} from "../../seedUtils.js";

interface CommentInput {
  id: string;
  userId: string;
}

interface UserInput {
  id: string;
}

export async function seedCommentLikes(
  prismaClient: PrismaClient,
  createdUsers: UserInput[],
  allComments: CommentInput[],
): Promise<void> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedCommentLikes.");
    return;
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for comment like creation. Skipping.");
    return;
  }
  if (!allComments || allComments.length === 0) {
    console.log("No comments provided for comment like creation. Skipping.");
    return;
  }

  console.log("Creating comment likes...");
  const commentLikesData: Prisma.CommentLikeCreateManyInput[] = [];

  // Process each comment
  for (const comment of allComments) {
    // Determine how many users should like/dislike this comment
    const likerQuantity = accountDataGenerator("random", 1, 10);
    
    // Get potential likers (excluding comment author)
    const potentialLikers = createdUsers.filter((u) => u.id !== comment.userId);
    
    if (potentialLikers.length === 0) continue;

    // Select random users to like/dislike
    const selectedLikers = faker.helpers
      .shuffle(potentialLikers)
      .slice(0, Math.min(likerQuantity, potentialLikers.length));

    for (const liker of selectedLikers) {
      // Randomly decide if it's a like or dislike (80% like, 20% dislike)
      const isLike = faker.datatype.boolean({ probability: 0.8 });

      commentLikesData.push({
        commentId: comment.id,
        userId: liker.id,
        isLike,
        createdAt: faker.date.recent({ days: 30 }),
      });
    }
  }

  if (commentLikesData.length === 0) {
    console.log("...No comment likes generated to create.");
    return;
  }

  try {
    const result = await prismaClient.commentLike.createMany({
      data: commentLikesData,
      skipDuplicates: true,
    });
    console.log(`...${result.count} comment likes created!`);
  } catch (error) {
    console.error("Error creating comment likes in DB:", error);
  }
}
