import { PrismaClient } from "@prisma/client";
import faker from "@faker-js/faker";

const prisma = new PrismaClient();

async function createPosts() {
  console.log("Creating posts...");
  const postPromises = [];

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { isVerified: true },
        { username: { not: { contains: "userNoPosts" } } },
      ],
    },
  });

  for (const user of users) {
    const postPromise = prisma.post.create({
      data: {
        content: faker.lorem.sentence(),
        userId: user.id,
      },
    });

    postPromises.push(postPromise);
  }

  await Promise.all(postPromises);
  console.log("Posts created successfully.");
}

async function main() {
  try {
    await prisma.$transaction(async (prismaTransaction) => {
      await createPosts();
    });

    console.log("Seeding posts finished.");
  } catch (e) {
    console.error("Seeding posts failed: ", e);
    throw e; // This will trigger the transaction rollback
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Unhandled error in main: ", e);
  process.exit(1);
});
