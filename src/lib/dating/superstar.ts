export const SUPERSTAR_MAX = 3;
export const SUPERSTAR_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type SuperstarState = {
  balance: number;
  nextAt: Date;
};

/**
 * Unused Superstars roll over and accumulate, up to 3.
 * A new star is granted one week after the previous grant.
 * While the bank is full, nothing accrues.
 * Spending the last star in a full bank starts the next week from that use.
 */
export function refreshSuperstars(
  balance: number,
  nextAt: Date | null,
  createdAt: Date,
  now = new Date(),
): SuperstarState {
  let credits = balance;
  let next = nextAt ? new Date(nextAt) : new Date(createdAt.getTime() + SUPERSTAR_WEEK_MS);

  while (credits < SUPERSTAR_MAX && now.getTime() >= next.getTime()) {
    credits += 1;
    next = new Date(next.getTime() + SUPERSTAR_WEEK_MS);
  }

  return { balance: credits, nextAt: next };
}

/**
 * Spend one banked star. Leaving a full bank starts the one-week timer.
 * Stars already banked can be spent immediately.
 */
export function spendSuperstar(
  balance: number,
  nextAt: Date | null,
  createdAt: Date,
  now = new Date(),
  replenish = true,
): { ok: true; balance: number; nextAt: Date } | { ok: false; balance: number; nextAt: Date } {
  const refreshed = replenish
    ? refreshSuperstars(balance, nextAt, createdAt, now)
    : {
        balance,
        nextAt: nextAt ? new Date(nextAt) : new Date(createdAt.getTime() + SUPERSTAR_WEEK_MS),
      };
  if (refreshed.balance < 1) {
    return { ok: false, balance: 0, nextAt: refreshed.nextAt };
  }

  const wasFull = refreshed.balance >= SUPERSTAR_MAX;
  return {
    ok: true,
    balance: refreshed.balance - 1,
    nextAt: wasFull ? new Date(now.getTime() + SUPERSTAR_WEEK_MS) : refreshed.nextAt,
  };
}

export function formatSuperstarDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
