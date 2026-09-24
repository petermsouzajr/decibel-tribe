import { describe, expect, it } from "vitest";
import { parseGrokVerdict, verdictPasses } from "@/lib/dating/grokVision";
import { pickPoses } from "@/lib/dating/poses";
import { dailyLikeCap, hasPersonOrIdAccess, rewindLimit, superstarsReplenish, verificationTier } from "@/lib/dating/verificationTier";
import { spendSuperstar } from "@/lib/dating/superstar";

describe("verification tiers", () => {
  it("keeps email accounts on the small like cap and one rewind", () => {
    expect(verificationTier({})).toBe("email");
    expect(dailyLikeCap("email")).toBe(15);
    expect(rewindLimit("email")).toBe(1);
    expect(superstarsReplenish("email")).toBe(false);
  });

  it("keeps History and Into You for person or ID verification", () => {
    expect(hasPersonOrIdAccess({})).toBe(false);
    expect(hasPersonOrIdAccess({ isPersonVerified: true })).toBe(true);
    expect(hasPersonOrIdAccess({ isIDVerified: true })).toBe(true);
  });

  it("treats paid rewards as feature access, not a badge input", () => {
    expect(verificationTier({ hasPersonPerks: true })).toBe("person");
    expect(verificationTier({ hasIdPerks: true })).toBe("id");
    expect(hasPersonOrIdAccess({ hasPersonPerks: true })).toBe(true);
    expect(hasPersonOrIdAccess({ hasIdPerks: true })).toBe(true);
    expect(dailyLikeCap(verificationTier({ hasPersonPerks: true }))).toBe(40);
    expect(dailyLikeCap(verificationTier({ hasIdPerks: true }))).toBeNull();
  });

  it("gives ID verified accounts the highest tier even without a pose check", () => {
    expect(verificationTier({ isIDVerified: true })).toBe("id");
    expect(dailyLikeCap("id")).toBeNull();
    expect(rewindLimit("id")).toBe(5);
  });
});

describe("pose selection", () => {
  it("picks three different poses", () => {
    const poses = pickPoses(3, () => 0);
    expect(new Set(poses.map((pose) => pose.id)).size).toBe(3);
  });
});

describe("Grok verdict", () => {
  it("accepts a full match", () => {
    const verdict = parseGrokVerdict(
      'note {"samePersonAcrossPoses":true,"posesMatched":[true,true,true],"samePersonAsProfile":true}',
      3,
    );
    expect(verdict && verdictPasses(verdict)).toBe(true);
  });

  it("rejects a short pose list", () => {
    expect(parseGrokVerdict('{"samePersonAcrossPoses":true,"posesMatched":[true],"samePersonAsProfile":true}', 3)).toBeNull();
  });
});

describe("Superstar replenishment", () => {
  it("does not grant another star when replenishment is off", () => {
    const created = new Date("2026-01-01T00:00:00.000Z");
    const later = new Date("2026-03-01T00:00:00.000Z");
    const spent = spendSuperstar(1, null, created, later, false);
    expect(spent.ok).toBe(true);
    if (spent.ok) expect(spent.balance).toBe(0);
  });
});
