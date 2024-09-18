import { PrismaClient } from "@prisma/client";
import faker from "@faker-js/faker";

const prisma = new PrismaClient();

async function createGroups() {
  console.log("Creating groups...");
  const groupPromises = [];

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { isVerified: true },
        { username: { not: { contains: "userNoGroupMemberships" } } },
      ],
    },
  });

  for (const user of users) {
    const groupPromise = prisma.group.create({
      data: {
        name: faker.company.name(),
        description: faker.lorem.sentence(),
        ownerId: user.id,
      },
    });

    groupPromises.push(groupPromise);
  }

  await Promise.all(groupPromises);
  console.log("Groups created successfully.");
}

async function main() {
  try {
    await prisma.$transaction(async (prismaTransaction) => {
      await createGroups();
    });

    console.log("Seeding groups finished.");
  } catch (e) {
    console.error("Seeding groups failed: ", e);
    throw e; // This will trigger the transaction rollback
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Unhandled error in main: ", e);
  process.exit(1);
});
