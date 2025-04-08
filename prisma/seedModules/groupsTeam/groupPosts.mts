import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  generateIdFromEntropySize,
  accountDataGenerator,
  // prisma is passed as an argument
} from "../../seedUtils.mjs"; // Corrected path and extension

// Interface for the group data expected
interface GroupInput {
  id: string;
  ownerId: string;
}

// Interface for the group member data expected
interface GroupMemberInput {
  id: string;
  userId: string;
  groupId: string;
  acceptedInvite: boolean;
}

// Interface for the data returned by this module
export interface CreatedPost {
  id: string;
  userId: string;
  groupId: string; // Group posts always have a group ID
  createdAt: Date;
  content: string; // Add content field
}

const userQuantity = 1; // Consider moving to seedUtils

export async function seedGroupPosts(
  prismaClient: PrismaClient,
  createdGroups: GroupInput[],
  createdGroupMembers: GroupMemberInput[],
): Promise<CreatedPost[]> {
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
  const postsData: Prisma.PostCreateManyInput[] = [];
  const createdPostsForReturn: CreatedPost[] = [];

  // Create a map of *accepted* members by group for efficient lookup
  const membersByGroup = new Map<string, GroupMemberInput[]>();
  for (const member of createdGroupMembers) {
    if (member.acceptedInvite) {
      if (!membersByGroup.has(member.groupId)) {
        membersByGroup.set(member.groupId, []);
      }
      membersByGroup.get(member.groupId)!.push(member);
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
        from: new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000),
        to: new Date(),
      });

      const postInput: Prisma.PostCreateManyInput = {
        id: postId,
        content: `group post ${faker.lorem.sentence()}`,
        userId: postAuthor.userId,
        groupId: group.id,
        createdAt: createdAtDate,
      };
      postsData.push(postInput);

      createdPostsForReturn.push({
        id: postId,
        userId: postAuthor.userId,
        groupId: group.id,
        createdAt: createdAtDate,
        content: `group post ${faker.lorem.sentence()}`,
      });
    }
  }

  if (postsData.length === 0) {
    console.log("...No group posts generated to create.");
    return [];
  }

  try {
    // Note: Using Post model for group posts
    await prismaClient.post.createMany({
      data: postsData,
      skipDuplicates: true,
    });
    console.log(`...${postsData.length} group posts created!`);
  } catch (error) {
    console.error("Error creating group posts in DB:", error);
    return []; // Return empty on DB error
  }

  return createdPostsForReturn;
}
