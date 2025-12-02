// Standalone script to run ONLY the dating seed
// Usage: npm run build:seed:dating && node dist/seedDatingOnly.js

const {
  prisma,
  streamChatClient,
  passwordHash,
} = await import("./seedUtils.js");

import { seedDatingProfiles } from "./seedModules/datingTeam/datingProfiles.js";

async function main() {
  console.log("Running dating seed only...");

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

