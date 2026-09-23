import prisma from "@/lib/prisma";
import { refreshSuperstars, SUPERSTAR_MAX } from "@/lib/dating/superstar";
import { superstarsReplenish, verificationTier } from "@/lib/dating/verificationTier";

/** One Superstar when an ID check first succeeds. A purchase does not call this. */
export async function grantIdSuperstarIfNeeded(userId: string): Promise<void> {
  const identity = await prisma.userDatingIdentityVerification.findUnique({
    where: { userId },
    select: { isIDVerified: true, idSuperstarGranted: true, isPersonVerified: true },
  });
  if (!identity?.isIDVerified || identity.idSuperstarGranted) return;

  await prisma.$transaction(async (tx) => {
    const current = await tx.userDatingIdentityVerification.findUnique({
      where: { userId },
      select: { isIDVerified: true, idSuperstarGranted: true, isPersonVerified: true },
    });
    if (!current?.isIDVerified || current.idSuperstarGranted) return;

    const prefs = await tx.userDatingPreferences.findUnique({
      where: { userId },
      select: { superstarBalance: true, superstarNextAt: true, createdAt: true },
    });
    if (!prefs) return;

    const replenish = superstarsReplenish(verificationTier(current));
    const refreshed = replenish
      ? refreshSuperstars(prefs.superstarBalance, prefs.superstarNextAt, prefs.createdAt)
      : { balance: prefs.superstarBalance, nextAt: prefs.superstarNextAt ?? prefs.createdAt };

    await tx.userDatingPreferences.update({
      where: { userId },
      data: {
        superstarBalance: Math.min(SUPERSTAR_MAX, refreshed.balance + 1),
        superstarNextAt: refreshed.nextAt,
      },
    });
    await tx.userDatingIdentityVerification.update({
      where: { userId },
      data: { idSuperstarGranted: true },
    });
  });
}
