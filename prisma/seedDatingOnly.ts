// Standalone script to run ONLY the dating seed
// Usage: npm run build:seed:dating && node dist/seedDatingOnly.js

const {
  prisma,
  streamChatClient,
  passwordHash,
} = await import("./seedUtils.js");

import { seedDatingProfiles } from "./seedModules/datingTeam/datingProfiles.js";

// Import the deletion function directly
import { deleteDatingTestUsers } from "./seedModules/datingTeam/datingProfiles.js";

async function main() {
  console.log("Running dating seed only...");

  // --- Deletion (outside transaction) ---
  // It's often safer to delete outside the main transaction
  // to avoid holding locks for too long or transaction size limits.
  console.log("Initiating deletion phase...");
  try {
    const deletedUserIds = await deleteDatingTestUsers(prisma, streamChatClient);
    console.log("Deletion phase completed.");
  } catch (error) {
    console.error("Error during deletion phase (continuing anyway):", error);
    // Continue even if deletion fails - seed will handle duplicates
  }

  console.log("Start seeding...");

  // --- Seeding (inside transaction) ---
  try {
    await prisma.$transaction(
      async (tx) => {
        console.log("Starting Prisma transaction for dating seed...");
        await seedDatingProfiles(tx as any, streamChatClient, passwordHash);
        console.log("Dating seed transaction committed successfully.");
      },
      {
        timeout: 300000, // 5 minutes timeout for dating seed (200+ users with photos)
      },
    );

    console.log("Dating seeding finished successfully.");
  } catch (error) {
    console.error("Error during dating seed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Dating seed script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
  });

