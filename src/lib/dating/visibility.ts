import prisma from "@/lib/prisma";

/** A paused or deleted account stays out of every other person's dating lists. */
export async function isHiddenFromDating(userId: string): Promise<boolean> {
  const person = await prisma.user.findUnique({
    where: { id: userId },
    select: { datingPausedAt: true, deletedAt: true },
  });
  return !person || person.datingPausedAt !== null || person.deletedAt !== null;
}
