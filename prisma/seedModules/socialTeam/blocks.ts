import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  accountDataGenerator,
} from "../../seedUtils.js";

interface UserInput {
  id: string;
}

export async function seedBlocks(
  prismaClient: PrismaClient,
  createdUsers: UserInput[],
): Promise<void> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedBlocks.");
    return;
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for block creation. Skipping.");
    return;
  }

  console.log("Creating blocks...");
  const blocksData: Prisma.BlockCreateManyInput[] = [];

  // Create blocks for a small percentage of users (5-10% of users will block someone)
  const usersToBlock = faker.helpers
    .shuffle(createdUsers)
    .slice(0, Math.floor(createdUsers.length * 0.1));

  for (const blocker of usersToBlock) {
    // Each blocker blocks 1-3 users
    const numberOfBlocks = faker.number.int({ min: 1, max: 3 });
    
    // Get potential users to block (excluding self)
    const potentialBlocked = createdUsers.filter((u) => u.id !== blocker.id);
    
    if (potentialBlocked.length === 0) continue;

    const blockedUsers = faker.helpers
      .shuffle(potentialBlocked)
      .slice(0, Math.min(numberOfBlocks, potentialBlocked.length));

    for (const blocked of blockedUsers) {
      blocksData.push({
        blockerId: blocker.id,
        blockedId: blocked.id,
        createdAt: faker.date.recent({ days: 60 }),
      });
    }
  }

  if (blocksData.length === 0) {
    console.log("...No blocks generated to create.");
    return;
  }

  try {
    const result = await prismaClient.block.createMany({
      data: blocksData,
      skipDuplicates: true,
    });
    console.log(`...${result.count} blocks created!`);
  } catch (error) {
    console.error("Error creating blocks in DB:", error);
  }
}
