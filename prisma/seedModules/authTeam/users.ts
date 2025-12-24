import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client"; // Import specific types
import {
  faker,
  generateIdFromEntropySize,
  cypressEnv,
  streamChatClient,
  passwordHash,
  // USER_PASSWORD, // Removed - Not exported from seedUtils
  // generateRandomFullName, // Removed - Not exported from seedUtils
  // TEAM_MEMBER_IDS, // Removed - Not exported from seedUtils
} from "../../seedUtils.js"; // Add .js extension

// Remove the CreatedUser interface if no longer needed externally
// interface CreatedUser { ... }

// Keep UserInput type if needed internally or rename
interface UserInputForCreate {
  id: string;
  username: string;
  email: string | null;
  isVerified: boolean;
  createdAt: Date;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  passwordHash: string | null;
  pendingEmail: string | null;
  googleId: string | null;
}

// Define the return type matching the findMany query result
// (Select only needed fields)
export interface SeededUser {
  id: string;
  username: string;
  createdAt: Date;
  isVerified: boolean;
}

const userQuantity = 1; // Define locally for this module

const prisma = new PrismaClient();

// Exported function to seed users
export async function seedUsers(
  // Use PrismaClient type from @prisma/client
  tx: PrismaClient | any, // Accept full client or transaction client (using any for simplicity here)
  streamClient: any,
  hasher: (pw: string) => Promise<string>,
): Promise<SeededUser[]> {
  // Return type updated
  if (!tx) {
    console.error("Prisma client is not available for seedUsers.");
    return [];
  }

  console.log("Seeding users...");
  const usersToCreate: Prisma.UserCreateInput[] = [];

  // Get user type keys and the email domain from the refactored cypressEnv
  const allKeys = Object.keys(cypressEnv);
  const userTypeKeys = allKeys.filter((key) => key.endsWith("User"));
  const emailDomain = cypressEnv.testUserEmailDomain; // Default fallback
  const password = cypressEnv.password;

  console.log(
    `Preparing ${userTypeKeys.length} users based on cypress.env.json keys...`,
  );

  const hashedPassword = await hasher(password);
  const usernamesToCreate: string[] = []; // Keep track of usernames we attempt to create

  for (const key of userTypeKeys) {
    const usernameRaw = cypressEnv[key as keyof typeof cypressEnv]; // Get username directly
    const username = (usernameRaw || "").trim();
    if (!username) continue; // Skip if username is somehow missing/blank
    usernamesToCreate.push(username);

    const userId = generateIdFromEntropySize(10);
    const email = `${username.toLowerCase()}${emailDomain}`; // Construct email

    // Determine user characteristics based on the KEY, not the username content
    const isGoogleLoginUser = key === "googleLoginUser";
    const isVerified = !key.toLowerCase().includes("unverified");
    const hasAvatar = !key.toLowerCase().includes("noavatar");
    const isNoBioUser = key.toLowerCase().includes("nobio");

    const googleId = isGoogleLoginUser
      ? `${faker.string.numeric(10)}${faker.string.alphanumeric(10)}`
      : null;
    const userPasswordHash = isGoogleLoginUser ? null : hashedPassword;
    let avatarUrl =
      hasAvatar && Math.random() < 0.8
        ? `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`
        : null;
    const bio = isNoBioUser ? null : faker.lorem.sentence();
    const createdAt = faker.date.between({
      from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      to: new Date(),
    });

    const userData: Prisma.UserCreateInput = {
      id: userId,
      username,
      email,
      displayName: username, // Ensure displayName is never blank
      passwordHash: userPasswordHash,
      isVerified,
      avatarUrl,
      googleId,
      bio,
      createdAt,
    };
    usersToCreate.push(userData);
  }

  // Use the passed prismaClient (tx)
  let createdCount = 0;
  try {
    const createResult = await tx.user.createMany({
      data: usersToCreate,
      skipDuplicates: true,
    });
    createdCount = createResult.count;
    console.log(`...${createdCount} users created/skipped in DB.`);

    if (usersToCreate.length > 0 && createdCount === 0) {
      console.warn(
        "Warning: User createMany reported 0 created users, duplicates might exist or DB issue.",
      );
    }

    // *** Fetch the actual created users ***
    const actualCreatedUsers = await tx.user.findMany({
      where: {
        // Filter based on usernames we intended to create
        username: { in: usernamesToCreate },
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        isVerified: true,
        // Select other fields ONLY if strictly needed by downstream modules
      },
    });

    console.log(
      `...Fetched ${actualCreatedUsers.length} actual users from DB.`,
    );

    // Prepare StreamChat users based on *actual* created users if possible,
    // or fallback to intended data if fetch fails/returns fewer than expected.
    // Using intended data for Stream Chat for simplicity now.
    console.log(`Adding ${usersToCreate.length} users to StreamChat...`);
    const streamChatUsers = usersToCreate.map((user) => ({
      id: user.id!,
      name: user.displayName!,
      image: user.avatarUrl,
      email: user.email!,
    }));

    if (streamClient) {
      try {
        await streamClient.upsertUsers(streamChatUsers);
        console.log(
          `...${streamChatUsers.length} users upserted to StreamChat.`,
        );
      } catch (error) {
        console.error(
          `Failed to add users to StreamChat:`,
          (error as Error).message,
        );
      }
    } else {
      console.warn(
        "Stream Chat client not available. Skipping Stream Chat user upsert.",
      );
    }

    return actualCreatedUsers; // <-- Return the users fetched from DB
  } catch (error) {
    console.error("Error during user seeding operations:", error);
    return []; // Return empty on any error during DB interaction
  }
}
