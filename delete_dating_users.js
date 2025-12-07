import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDatingUsers() {
  console.log('Deleting all dating users...');
  
  // Delete all users with isDatingActive or username starting with dating_user_
  const result = await prisma.user.deleteMany({
    where: {
      OR: [
        { username: { startsWith: 'dating_user_' } },
        { email: { endsWith: '@xyzc2.com' } }
      ]
    }
  });
  
  console.log(`Deleted ${result.count} users`);
  
  await prisma.$disconnect();
}

deleteDatingUsers().catch(console.error);
