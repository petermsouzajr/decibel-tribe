export type VerificationTier = "email" | "person" | "id";

export const EMAIL_DAILY_LIKES = 15;
export const PERSON_DAILY_LIKES = 40;
export const EMAIL_REWIND_LIMIT = 1;
export const FULL_REWIND_LIMIT = 5;

export type VerificationFlags = {
  isPersonVerified?: boolean;
  isIDVerified?: boolean;
  /** Paid Person rewards. Not a verification badge. */
  hasPersonPerks?: boolean;
  /** Paid ID rewards. Not a verification badge. */
  hasIdPerks?: boolean;
};

export function verificationTier(flags: VerificationFlags): VerificationTier {
  if (flags.isIDVerified || flags.hasIdPerks) return "id";
  if (flags.isPersonVerified || flags.hasPersonPerks) return "person";
  return "email";
}

/** Null means no daily cap. The hourly abuse limit still applies. */
export function dailyLikeCap(tier: VerificationTier): number | null {
  if (tier === "id") return null;
  if (tier === "person") return PERSON_DAILY_LIKES;
  return EMAIL_DAILY_LIKES;
}

export function rewindLimit(tier: VerificationTier): number {
  return tier === "email" ? EMAIL_REWIND_LIMIT : FULL_REWIND_LIMIT;
}

/** Email accounts keep the starting star. Person and ID accounts replenish. */
export function superstarsReplenish(tier: VerificationTier): boolean {
  return tier !== "email";
}

/** History and Into You. Email-only accounts do not get either. Paid perks count; badges stay separate. */
export function hasPersonOrIdAccess(flags: VerificationFlags): boolean {
  return Boolean(
    flags.isPersonVerified || flags.isIDVerified || flags.hasPersonPerks || flags.hasIdPerks,
  );
}

export const PERSON_OR_ID_REQUIRED =
  "Verify it’s you, verify your ID, or unlock rewards to open this.";
