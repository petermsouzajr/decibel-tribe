import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
} from "../../seedUtils.js";
import instrumentList from "../../../src/data/instrumentList.json";

interface UserInput {
  id: string;
}

export async function seedUserInstruments(
  prismaClient: PrismaClient,
  createdUsers: UserInput[],
): Promise<void> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedUserInstruments.");
    return;
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for user instrument creation. Skipping.");
    return;
  }

  console.log("Creating user instruments...");

  // First, ensure all instruments exist in the database
  const instrumentsToCreate = instrumentList.map((name: string) => ({
    name,
  }));

  await prismaClient.instrument.createMany({
    data: instrumentsToCreate,
    skipDuplicates: true,
  });

  // Fetch all instruments
  const allInstruments = await prismaClient.instrument.findMany({
    select: { id: true, name: true },
  });

  const userInstrumentsData: Prisma.UserInstrumentCreateManyInput[] = [];

  // Assign instruments to users (60-70% of users will have instruments)
  const usersWithInstruments = faker.helpers
    .shuffle(createdUsers)
    .slice(0, Math.floor(createdUsers.length * faker.number.float({ min: 0.6, max: 0.7 })));

  for (const user of usersWithInstruments) {
    // Each user has 1-5 instruments
    const numberOfInstruments = faker.number.int({ min: 1, max: 5 });
    const selectedInstruments = faker.helpers
      .shuffle(allInstruments)
      .slice(0, numberOfInstruments);

    for (const instrument of selectedInstruments) {
      userInstrumentsData.push({
        userId: user.id,
        instrumentId: instrument.id,
      });
    }
  }

  if (userInstrumentsData.length === 0) {
    console.log("...No user instruments generated to create.");
    return;
  }

  try {
    const result = await prismaClient.userInstrument.createMany({
      data: userInstrumentsData,
      skipDuplicates: true,
    });
    console.log(`...${result.count} user instruments created!`);
  } catch (error) {
    console.error("Error creating user instruments in DB:", error);
  }
}
