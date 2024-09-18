import { PrismaClient } from "@prisma/client";
import faker from "@faker-js/faker";

const prisma = new PrismaClient();

async function createComments() {
  console.log("Creating comments...");
  const commentPromises = [];

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { isVerified: true },
        { username: { not: { contains: "userNoComments" } } },
      ],
    },
  });

  for (const user of users) {
    const commentPromise = prisma.comment.create({
      data: {
        content: faker.lorem.sentence(),
        userId: user.id,
        postId: faker.datatype.uuid(), // Assuming you have a way to get post IDs
      },
    });

    commentPromises.push(commentPromise);
  }

  await Promise.all(commentPromises);
  console.log("Comments created successfully.");
}

async function main() {
  try {
    await prisma.$transaction(async (prismaTransaction) => {
      await createComments();
    });

    console.log("Seeding comments finished.");
  } catch (e) {
    console.error("Seeding comments failed: ", e);
    throw e; // This will trigger the transaction rollback
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Unhandled error in main: ", e);
  process.exit(1);
});
