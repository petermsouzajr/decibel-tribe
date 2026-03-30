import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: 'testUserDatingIDVerified1' },
    include: {
      userDatingProfile: true,
      userDatingPreferences: true
    }
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  console.log("=== User ===");
  console.log("ID:", user.id);
  
  console.log("\n=== Dating Profile ===");
  console.log("Gender:", user.userDatingProfile?.gender);
  console.log("Orientation:", user.userDatingProfile?.sexualOrientation);
  console.log("Age:", user.userDatingProfile?.age);
  console.log("City:", user.userDatingProfile?.city);
  console.log("Verified:", user.isIDVerified);
  
  console.log("\n=== Dating Preferences ===");
  console.log("preferredGender:", user.userDatingPreferences?.preferredGender);
  console.log("Min/Max Age:", user.userDatingPreferences?.preferredMinAge, "-", user.userDatingPreferences?.preferredMaxAge);
  console.log("Max Distance:", user.userDatingPreferences?.preferredMaxDistanceKm);
  console.log("ID Verification Filter:", user.userDatingPreferences?.idVerificationFilter);

  // Find potential matches based on basic criteria
  if (user.userDatingPreferences?.preferredGender) {
    let prefGenders = [];
    try {
      prefGenders = JSON.parse(user.userDatingPreferences.preferredGender);
    } catch(e) {}
    
    console.log("\nParsed Preferred Genders:", JSON.stringify(prefGenders));
    
    // Quick count of potential matches by gender
    if (Array.isArray(prefGenders)) {
      for (const p of prefGenders) {
         const count = await prisma.userDatingProfile.count({
            where: {
              gender: p.gender,
              userId: { not: user.id }
            }
         });
         console.log(`Users with gender ${p.gender}: ${count}`);
      }
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
