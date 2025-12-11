import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
} from "../../seedUtils.js";
import * as fs from "fs";
import * as path from "path";

const skillsListPath = path.join(process.cwd(), "src/data/skillsList.json");
const skillsList = JSON.parse(fs.readFileSync(skillsListPath, "utf-8")) as string[];

interface UserInput {
  id: string;
}

export async function seedUserSkills(
  prismaClient: PrismaClient,
  createdUsers: UserInput[],
): Promise<void> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedUserSkills.");
    return;
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for user skill creation. Skipping.");
    return;
  }

  console.log("Creating user skills...");

  // First, ensure all skills exist in the database
  const skillsToCreate = skillsList.map((name: string) => ({
    name,
  }));

  await prismaClient.skill.createMany({
    data: skillsToCreate,
    skipDuplicates: true,
  });

  // Fetch all skills
  const allSkills = await prismaClient.skill.findMany({
    select: { id: true, name: true },
  });

  const userSkillsData: Prisma.UserSkillCreateManyInput[] = [];

  // Assign skills to users (50-60% of users will have skills)
  const usersWithSkills = faker.helpers
    .shuffle(createdUsers)
    .slice(0, Math.floor(createdUsers.length * faker.number.float({ min: 0.5, max: 0.6 })));

  for (const user of usersWithSkills) {
    // Each user has 1-4 skills
    const numberOfSkills = faker.number.int({ min: 1, max: 4 });
    const selectedSkills = faker.helpers
      .shuffle(allSkills)
      .slice(0, numberOfSkills);

    for (const skill of selectedSkills) {
      userSkillsData.push({
        userId: user.id,
        skillId: skill.id,
      });
    }
  }

  if (userSkillsData.length === 0) {
    console.log("...No user skills generated to create.");
    return;
  }

  try {
    const result = await prismaClient.userSkill.createMany({
      data: userSkillsData,
      skipDuplicates: true,
    });
    console.log(`...${result.count} user skills created!`);
  } catch (error) {
    console.error("Error creating user skills in DB:", error);
  }
}
