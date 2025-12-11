import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  generateIdFromEntropySize,
} from "../../seedUtils.js";

interface UserInput {
  id?: string;
  userId?: string; // For CreatedDatingUser type
  isDatingActive?: boolean;
}

export async function seedMatches(
  prismaClient: PrismaClient,
  datingUsers: UserInput[],
): Promise<void> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedMatches.");
    return;
  }
  if (!datingUsers || datingUsers.length === 0) {
    console.log("No dating users provided for match creation. Skipping.");
    return;
  }

  console.log("Creating additional matches...");

  // Normalize user IDs (handle both CreatedDatingUser and regular user objects)
  const normalizedUsers = datingUsers.map((u) => ({
    id: u.id || u.userId || "",
    isDatingActive: u.isDatingActive ?? true,
  })).filter((u) => u.id && u.isDatingActive);

  if (normalizedUsers.length < 2) {
    console.log("...Not enough dating users to create matches. Skipping.");
    return;
  }

  const matchesData: Array<{ id: string; user1Id: string; user2Id: string; createdAt: Date }> = [];
  
  // Create matches for 10-15% of users (each match involves 2 users)
  const numberOfMatches = Math.floor(normalizedUsers.length * faker.number.float({ min: 0.1, max: 0.15 }));
  
  // Create a set to track which user pairs have already been matched
  const matchedPairs = new Set<string>();

  for (let i = 0; i < numberOfMatches && matchedPairs.size < numberOfMatches; i++) {
    // Select two random users
    const [user1, user2] = faker.helpers.shuffle(normalizedUsers).slice(0, 2);
    
    if (user1.id === user2.id) continue;

    // Create a consistent key for the pair (always smaller ID first)
    const pairKey = user1.id < user2.id 
      ? `${user1.id}-${user2.id}` 
      : `${user2.id}-${user1.id}`;

    // Skip if this pair is already matched
    if (matchedPairs.has(pairKey)) continue;

    matchedPairs.add(pairKey);

    const matchId = generateIdFromEntropySize(10);
    const user1Id = user1.id < user2.id ? user1.id : user2.id;
    const user2Id = user1.id < user2.id ? user2.id : user1.id;

    matchesData.push({
      id: matchId,
      user1Id,
      user2Id,
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  if (matchesData.length === 0) {
    console.log("...No matches generated to create.");
    return;
  }

  try {
    // Create matches one by one to handle duplicates gracefully
    let createdCount = 0;
    for (const match of matchesData) {
      try {
        await prismaClient.matches.create({
          data: match,
        });
        createdCount++;
      } catch (error) {
        // Skip if match already exists
        // This can happen if matches were created in datingProfiles.ts
      }
    }
    console.log(`...${createdCount} additional matches created!`);
  } catch (error) {
    console.error("Error creating matches in DB:", error);
  }
}
