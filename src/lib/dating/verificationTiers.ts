/**
 * Helper functions for checking Dating Tribe verification and perk tiers.
 * 
 * Verification badges (isIDVerified) are earned through identity verification only.
 * Paid perks (hasPersonPerks, hasIdPerks) grant access to tier-specific features.
 * 
 * For feature access:
 * - Person tier: hasPersonPerks OR isIDVerified (ID verification includes all Person features)
 * - ID tier: hasIdPerks OR isIDVerified
 * 
 * For badge display: Only isIDVerified matters.
 */

export type VerificationPerkStatus = {
  isIDVerified: boolean;
  hasPersonPerks: boolean;
  hasIdPerks: boolean;
};

export function hasPersonTierAccess(status: VerificationPerkStatus): boolean {
  return status.hasPersonPerks || status.isIDVerified || status.hasIdPerks;
}

export function hasIdTierAccess(status: VerificationPerkStatus): boolean {
  return status.hasIdPerks || status.isIDVerified;
}

export function canAppearInIdVerifiedFilter(status: VerificationPerkStatus): boolean {
  return hasIdTierAccess(status);
}

export function shouldShowIdVerifiedBadge(status: VerificationPerkStatus): boolean {
  return status.isIDVerified;
}
