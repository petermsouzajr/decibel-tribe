import { Prisma } from "@prisma/client";
import {
  faker,
  random,
  weightedRandom,
  // generateIdFromEntropySize, // ID is not needed for this relation
  accountDataGenerator,
  // prisma is passed as an argument
} from "../../seedUtils.js";

// Interface for the user data expected
interface UserInput {
  id: string;
  username: string; // For 'noFollowers' check
  isVerified: boolean; // Assuming only verified users can be followed initially
}

// Interface for the data returned by this module
export interface CreatedFollow {
  followerId: string;
  followingId: string;
  // createdAt could be added if the schema has it
}

const userQuantity = 1; // Consider moving to seedUtils

export async function seedFollows(
  prismaClient: any,
  createdUsers: UserInput[],
): Promise<CreatedFollow[]> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedFollows.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for follow creation. Skipping.");
    return [];
  }

  console.log("Creating follows...");
  const followerData: Prisma.FollowCreateManyInput[] = []; // Use correct type
  const createdFollowsForReturn: CreatedFollow[] = [];

  // Filter users who can be followed (e.g., verified and not 'noFollowers')
  const followableUsers = createdUsers.filter(
    (user) => user.isVerified && !user.username.includes("noFollowers"),
  );

  if (followableUsers.length === 0) {
    console.log("...No followable users found. Skipping follow creation.");
    return [];
  }

  for (const user of followableUsers) {
    // Determine how many followers this user should have
    const numberOfFollowers = accountDataGenerator("random", userQuantity, 30); // Max 30 followers

    if (numberOfFollowers === 0) continue;

    // Select random users to be followers, excluding the user themselves
    const potentialFollowers = createdUsers.filter((u) => u.id !== user.id);

    // Ensure there are potential followers to choose from
    if (potentialFollowers.length === 0) continue;

    const followers = faker.helpers
      .shuffle(potentialFollowers)
      .slice(0, numberOfFollowers);

    for (const follower of followers) {
      const followInput: Prisma.FollowCreateManyInput = {
        followerId: follower.id,
        followingId: user.id,
        // Add createdAt if needed: createdAt: faker.date.recent()
      };
      followerData.push(followInput);
      createdFollowsForReturn.push({
        followerId: follower.id,
        followingId: user.id,
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
      skipDuplicates: true,
    });
    console.log(`...${followerData.length} follows created!`);
  } catch (error) {
    console.error("Error creating follows in DB:", error);
    return []; // Return empty on DB error
  }

  return createdFollowsForReturn;
}
