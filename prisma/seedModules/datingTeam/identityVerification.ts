import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
} from "../../seedUtils.js";

interface UserInput {
  id?: string;
  userId?: string; // For CreatedDatingUser type
  isDatingActive?: boolean;
  username?: string;
}

// Named test users that need deterministic ID verification records
// (so testers can reliably exercise the verified/unverified filter UI)
const EXPLICIT_VERIFIED_USERNAMES = [
  "testUserDatingIDVerified1",
  "testUserDatingIDVerified2",
];
const EXPLICIT_UNVERIFIED_USERNAMES = [
  "testUserDatingIDUnverified1",
  "testUserDatingIDUnverified2",
];

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
    username: u.username || "",
  })).filter((u) => u.id && u.isDatingActive);

  const verificationData: Prisma.UserDatingIdentityVerificationCreateManyInput[] = [];
  const handledUserIds = new Set<string>();

  // ── Deterministic records for named test users ───────────────────────────
  // These are looked up by username so the tester always gets a predictable state.
  for (const user of normalizedUsers) {
    if (EXPLICIT_VERIFIED_USERNAMES.includes(user.username)) {
      verificationData.push({
        userId: user.id,
        isIDVerified: true,
        verificationStatus: "verified",
        verificationMethod: "stripe_identity",
        documentType: "drivers_license",
        verifiedAt: faker.date.recent({ days: 14 }),
        failureReason: null,
        attemptsCount: 1,
        lastAttemptAt: faker.date.recent({ days: 14 }),
        createdAt: faker.date.recent({ days: 30 }),
      });
      handledUserIds.add(user.id);
      console.log(`  ...Explicit VERIFIED record for ${user.username}`);
    } else if (EXPLICIT_UNVERIFIED_USERNAMES.includes(user.username)) {
      verificationData.push({
        userId: user.id,
        isIDVerified: false,
        verificationStatus: "pending",  // Has a record but not yet verified
        verificationMethod: "stripe_identity",
        documentType: null,
        verifiedAt: null,
        failureReason: null,
        attemptsCount: 1,
        lastAttemptAt: faker.date.recent({ days: 7 }),
        createdAt: faker.date.recent({ days: 10 }),
      });
      handledUserIds.add(user.id);
      console.log(`  ...Explicit UNVERIFIED (pending) record for ${user.username}`);
    }
  }

  // ── Random records for the remaining 30-40% of users ────────────────────
  const remainingUsers = normalizedUsers.filter((u) => !handledUserIds.has(u.id));
  const usersToVerify = faker.helpers
    .shuffle(remainingUsers)
    .slice(0, Math.floor(remainingUsers.length * faker.number.float({ min: 0.3, max: 0.4 })));

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
    console.log(`   (${EXPLICIT_VERIFIED_USERNAMES.length} explicit verified, ${EXPLICIT_UNVERIFIED_USERNAMES.length} explicit unverified, ${result.count - EXPLICIT_VERIFIED_USERNAMES.length - EXPLICIT_UNVERIFIED_USERNAMES.length} random)`);
  } catch (error) {
    console.error("Error creating identity verifications in DB:", error);
  }
}
