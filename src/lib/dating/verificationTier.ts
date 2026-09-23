export type VerificationTier = "email" | "person" | "id";

export const EMAIL_DAILY_LIKES = 15;
export const PERSON_DAILY_LIKES = 40;
export const EMAIL_REWIND_LIMIT = 1;
export const FULL_REWIND_LIMIT = 5;

export function verificationTier(flags: {
  isPersonVerified?: boolean;
  isIDVerified?: boolean;
}): VerificationTier {
  if (flags.isIDVerified) return "id";
  if (flags.isPersonVerified) return "person";
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

/** History and Into You. Email-only accounts do not get either. */
export function hasPersonOrIdAccess(flags: {
  isPersonVerified?: boolean;
  isIDVerified?: boolean;
}): boolean {
  return Boolean(flags.isPersonVerified || flags.isIDVerified);
}

export const PERSON_OR_ID_REQUIRED =
  "Verify it’s you with three quick poses, or verify your ID, to open this.";
