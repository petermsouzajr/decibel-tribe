const { prisma, streamChatClient, cypressEnv } = await import("./seedUtils.js");
import { deleteTestUsers, deleteTestUsersFromStreamChat } from "./seedDeletion.js";

async function main() {
  const testDomain = cypressEnv?.testUserEmailDomain;
  if (!testDomain || typeof testDomain !== "string") {
    throw new Error(
      "Missing cypressEnv.testUserEmailDomain. Set it in cypress.env.json to safely target test users.",
    );
  }

  console.log(`Purging test users from DB/StreamChat (domain: ${testDomain})...`);

  const deletedUserIds = await deleteTestUsers(prisma);
  await deleteTestUsersFromStreamChat(streamChatClient, deletedUserIds, testDomain);

  console.log(
    `Done. Deleted ${deletedUserIds.length} test users (domain: ${testDomain}).`,
  );
}

main()
  .catch((e) => {
    console.error("Purge script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
  });

