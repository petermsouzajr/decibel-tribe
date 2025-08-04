import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  random,
  generateIdFromEntropySize,
  accountDataGenerator,
  cypressEnv,
  // prisma is passed as an argument
} from "../../seedUtils.js";

// Interface for the user data expected by this module
interface UserInput {
  id: string;
  username: string; // Keep username if filtering logic depends on it
  createdAt: Date;
  // Include other fields from CreatedUser if needed
}

// Interface for the data returned by this module
export interface CreatedGroup {
  id: string;
  ownerId: string;
  createdAt: Date;
}

const userQuantity = 1; // Consider moving this to seedUtils if used universally

export async function seedGroups(
  prismaClient: PrismaClient,
  createdUsers: UserInput[],
): Promise<CreatedGroup[]> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedGroups.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for group creation. Skipping.");
    return [];
  }

  console.log("Creating groups...");
  const groupsData: Prisma.GroupCreateManyInput[] = []; // Use CreateManyInput type
  const createdGroupsForReturn: CreatedGroup[] = [];

  const eligibleUsers = createdUsers;

  // Original logic iterated every 2 users, let's just iterate all
  for (const user of eligibleUsers) {
    // Assuming 0-3 groups per user for simplicity
    const groupQuantity = faker.number.int({ min: 0, max: 3 });

    for (let i = 0; i < groupQuantity; i++) {
      const groupId = generateIdFromEntropySize(10);
      const createdAtDate = faker.date.between({
        from: user.createdAt,
        to: new Date(),
      });

      const groupInput: Prisma.GroupCreateManyInput = {
        id: groupId,
        name: faker.company.name(),
        description: faker.lorem.sentence(),
        ownerId: user.id, // Use flat ownerId for CreateManyInput
        createdAt: createdAtDate,
      };
      groupsData.push(groupInput);

      createdGroupsForReturn.push({
        id: groupId,
        ownerId: user.id,
        createdAt: createdAtDate, // Keep createdAt here
      });
    }
  }

  if (groupsData.length === 0) {
    console.log("...No groups generated to create.");
    return [];
  }

  try {
    await prismaClient.group.createMany({
      data: groupsData,
      skipDuplicates: true,
    });
    console.log(`...${groupsData.length} groups created!`);
  } catch (error) {
    console.error("Error creating groups in DB:", error);
    return []; // Return empty on DB error
  }

  return createdGroupsForReturn;
}
