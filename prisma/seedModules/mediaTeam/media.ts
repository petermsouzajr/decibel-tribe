import { Prisma, MediaType } from "@prisma/client";
import {
  faker,
  generateIdFromEntropySize,
  cypressEnv,
} from "../../seedUtils.js";

// Interface for the post data expected
interface PostInput {
  id: string;
  // Add other post fields if needed for filtering/logic
}

// Interface for the data returned (optional, could just be void or count)
export interface CreatedMedia {
  type: MediaType;
  url: string;
  postId: string;
}

export async function seedMedia(
  prismaClient: any,
  allPosts: PostInput[],
): Promise<void> {
  // Return void as original function didn't return data
  if (!prismaClient) {
    console.error("Prisma client is not available for seedMedia.");
    return;
  }
  if (!allPosts || allPosts.length === 0) {
    console.log("No posts provided for media creation. Skipping.");
    return;
  }

  console.log("Creating media for posts...");
  const mediaData: Prisma.MediaCreateManyInput[] = [];
  const mediaTypes = [MediaType.IMAGE, MediaType.VIDEO]; // Use enum from Prisma

  const getMediaUrl = (type: MediaType): string => {
    if (type === MediaType.IMAGE) {
      // Using a placeholder service; consider replacing with a stable source or local files
      return `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/400/300`;
      // Original: return `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`;
    } else if (type === MediaType.VIDEO) {
      // Placeholder video URL
      return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      // Original: return "https://www.w3schools.com/html/mov_bbb.mp4#t=0,2";
    }
    return ""; // Should not happen with defined types
  };

  // Process posts, potentially skipping some based on original logic (e.g., every other post)
  for (let i = 0; i < allPosts.length; i += 2) {
    const post = allPosts[i];
    const numberOfMedia = faker.number.int({ min: 0, max: 5 }); // Max 5 media items per post

    if (numberOfMedia === 0) continue;

    for (let j = 0; j < numberOfMedia; j++) {
      const type = faker.helpers.arrayElement(mediaTypes);
      const url = getMediaUrl(type);

      if (url) {
        const mediaInput: Prisma.MediaCreateManyInput = {
          type,
          url,
          postId: post.id,
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
      skipDuplicates: true,
    });
    console.log(`...${result.count} pieces of media created!`);
  } catch (error) {
    console.error("Error creating media in DB:", error);
  }
}
