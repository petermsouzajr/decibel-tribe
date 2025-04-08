import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  generateIdFromEntropySize,
  accountDataGenerator,
} from "../../seedUtils.mjs";

// Define minimal local interfaces for expected input
interface UserInput {
  id: string;
  username: string;
}
interface PostInput {
  id: string;
  userId: string;
  // Add other fields if needed by seedBookmarks logic (doesn't seem so)
}

// Interface for the data returned by this module (void)

export const seedBookmarks = async (
  prisma: PrismaClient,
  createdUsers: UserInput[],
  createdPosts: PostInput[],
) => {
  console.log("Creating bookmarks...");
  if (!prisma) {
    console.error("Prisma client is not available for seedBookmarks.");
    return;
  }
  if (createdPosts.length === 0 || createdUsers.length === 0) {
    console.log("No posts or users provided for bookmark creation. Skipping.");
    return;
  }

  const allBookmarks: Prisma.BookmarkCreateManyInput[] = [];
  const eligibleUsers = createdUsers.filter(
    (u) => !u.username.includes("noBookmarks"), // Exclude specific users
  );

  if (eligibleUsers.length === 0) {
    console.log("No eligible users found to create bookmarks.");
    return;
  }

  // Only bookmark posts at even indices (0, 2, 4, ...)
  for (let i = 0; i < createdPosts.length; i += 2) {
    const post = createdPosts[i];
    if (!post) continue;

    // Ensure the post's creator isn't the only eligible user
    const potentialBookmarkers = eligibleUsers.filter(
      (u) => u.id !== post.userId,
    );
    if (potentialBookmarkers.length === 0) continue; // Skip if only creator is eligible

    const bookmarkerQuantity = accountDataGenerator("random", 1, 10); // Fewer bookmarks
    const selectedBookmarkers = faker.helpers
      .shuffle(potentialBookmarkers)
      .slice(0, bookmarkerQuantity);

    for (const user of selectedBookmarkers) {
      allBookmarks.push({
        userId: user.id,
        postId: post.id,
        // createdAt can be added if needed, defaults to now()
      });
    }
  }

  if (allBookmarks.length > 0) {
    try {
      const result = await prisma.bookmark.createMany({
        data: allBookmarks,
        skipDuplicates: true,
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
