import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client"; // Import specific types
import {
  faker,
  generateIdFromEntropySize,
  cypressEnv,
  streamChatClient,
  passwordHash,
} from "../../seedUtils.mts"; // Ensure path and extension are correct

// Define the structure of the returned user data
interface CreatedUser {
  id: string;
  username: string;
  email: string | null; // Match Prisma type
  isVerified: boolean;
  createdAt: Date;
  // Make displayName non-nullable
  displayName: string;
  avatarUrl: string | null; // Match Prisma type
  bio: string | null; // Match Prisma type
  passwordHash: string | null;
  pendingEmail: string | null;
  googleId: string | null;
}

const userQuantity = 1; // Define locally for this module

// Exported function to seed users
export async function seedUsers(
  prismaClient: any,
  streamClient: any,
  hasher: (pw: string) => Promise<string>,
): Promise<CreatedUser[]> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedUsers.");
    return [];
  }

  console.log("Seeding users...");
  const usersData: Prisma.UserCreateInput[] = [];
  const createdUsersForReturn: CreatedUser[] = [];

  // Get user type keys and the email domain from the refactored cypressEnv
  const allKeys = Object.keys(cypressEnv);
  const userTypeKeys = allKeys.filter((key) => key.endsWith("User"));
  const emailDomain = cypressEnv.testUserEmailDomain; // Default fallback
  const password = cypressEnv.password;

  console.log(
    `Creating ${userTypeKeys.length} users based on cypress.env.json keys...`,
  );

  const hashedPassword = await hasher(password);

  for (const key of userTypeKeys) {
    const username = cypressEnv[key as keyof typeof cypressEnv]; // Get username directly
    if (!username) continue; // Skip if username is somehow missing

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
      displayName: username, // Use username as default displayName
      passwordHash: userPasswordHash,
      isVerified,
      avatarUrl,
      googleId,
      bio,
      createdAt,
    };
    usersData.push(userData);

    // Add data needed by other modules to the return array
    createdUsersForReturn.push({
      id: userId,
      username: username,
      email: email,
      isVerified: isVerified,
      createdAt: createdAt,
      displayName: username,
      avatarUrl: avatarUrl,
      bio: bio,
      passwordHash: userPasswordHash,
      pendingEmail: null, // Assuming no pending email during initial seed
      googleId: googleId,
    });
  }

  // Use the passed prismaClient
  try {
    await prismaClient.user.createMany({
      data: usersData,
      skipDuplicates: true,
    });
    console.log(`...${usersData.length} users created in DB.`);
  } catch (error) {
    console.error("Error creating users in DB:", error);
    // Decide if we should return early or continue to StreamChat upsert
    return []; // Return empty on DB error for now
  }

  // Add users to StreamChat
  console.log(`Adding ${usersData.length} users to StreamChat...`);
  const streamChatUsers = usersData.map((user) => ({
    id: user.id!,
    name: user.displayName!,
    image: user.avatarUrl,
    email: user.email!,
    // Add any other custom fields needed by StreamChat
  }));

  // Use the passed streamClient
  if (streamClient) {
    try {
      await streamClient.upsertUsers(streamChatUsers);
      console.log(`...${streamChatUsers.length} users upserted to StreamChat.`);
    } catch (error) {
      console.error(
        `Failed to add users to StreamChat:`,
        (error as Error).message,
      );
      // Log error but don't necessarily fail the whole seed process
    }
  } else {
    console.warn(
      "Stream Chat client not available. Skipping Stream Chat user upsert.",
    );
  }

  return createdUsersForReturn; // Return the specifically structured data
}
