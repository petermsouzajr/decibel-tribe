// Upsert existing dating test users to Stream Chat in batches of 100.
// Does not wipe Postgres. Usage: npm run db:stream:dating-users

const { prisma, streamChatClient, upsertStreamUsersInBatches } = await import(
  "./seedUtils.js"
);

async function main() {
  if (!streamChatClient) {
    throw new Error("Stream Chat client not initialized (missing key/secret).");
  }

  console.log("Fetching dating test users from the database...");
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { startsWith: "dating_user_" } },
        { username: { startsWith: "testUserDating" } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      email: true,
    },
  });

  console.log(`Found ${users.length} dating users. Upserting to Stream Chat in batches of 100...`);
  await upsertStreamUsersInBatches(
    streamChatClient,
    users.map((u) => ({
      id: u.id,
      name: u.displayName || u.username,
      image: u.avatarUrl,
      email: u.email,
    })),
  );
  console.log(`Done. ${users.length} dating users upserted to Stream Chat.`);
}

main()
  .catch((e) => {
    console.error("Stream dating upsert failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
