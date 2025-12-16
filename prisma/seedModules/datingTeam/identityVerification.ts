import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
} from "../../seedUtils.js";

interface UserInput {
  id?: string;
  userId?: string; // For CreatedDatingUser type
  isDatingActive?: boolean;
}

export async function seedIdentityVerification(
  prismaClient: PrismaClient,
  datingUsers: UserInput[],
): Promise<void> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedIdentityVerification.");
    return;
  }
  if (!datingUsers || datingUsers.length === 0) {
    console.log("No dating users provided for identity verification creation. Skipping.");
    return;
  }

  console.log("Creating identity verifications...");

  // Normalize user IDs (handle both CreatedDatingUser and regular user objects)
  const normalizedUsers = datingUsers.map((u) => ({
    id: u.id || u.userId || "",
    isDatingActive: u.isDatingActive ?? true,
  })).filter((u) => u.id && u.isDatingActive);

  const verificationData: Prisma.userDatingIdentityVerificationCreateManyInput[] = [];

  // 30-40% of dating users will have verification records
  const usersToVerify = faker.helpers
    .shuffle(normalizedUsers)
    .slice(0, Math.floor(normalizedUsers.length * faker.number.float({ min: 0.3, max: 0.4 })));

  for (const user of usersToVerify) {
    // Randomly assign verification status
    const statuses = ["not_started", "pending", "verified", "failed", "requires_input"];
    const verificationStatus = faker.helpers.arrayElement(statuses);
    const isIDVerified = verificationStatus === "verified";

    verificationData.push({
      userId: user.id,
      isIDVerified,
      verificationStatus,
      verificationMethod: faker.helpers.arrayElement(["stripe_identity", "manual", null]),
      documentType: faker.helpers.arrayElement(["passport", "drivers_license", "id_card", null]),
      verifiedAt: isIDVerified ? faker.date.recent({ days: 30 }) : null,
      failureReason: verificationStatus === "failed" ? faker.lorem.sentence() : null,
      attemptsCount: faker.number.int({ min: 0, max: 3 }),
      lastAttemptAt: verificationStatus !== "not_started" ? faker.date.recent({ days: 30 }) : null,
      createdAt: faker.date.recent({ days: 60 }),
    });
  }

  if (verificationData.length === 0) {
    console.log("...No identity verifications generated to create.");
    return;
  }

  try {
    const result = await prismaClient.userDatingIdentityVerification.createMany({
      data: verificationData,
      skipDuplicates: true,
    });
    console.log(`...${result.count} identity verifications created!`);
  } catch (error) {
    console.error("Error creating identity verifications in DB:", error);
  }
}
