export type IdentityStatus = "not_started" | "pending" | "verified" | "failed" | "requires_input";

export type IdentityFields = {
  isIDVerified: boolean;
  verificationStatus: IdentityStatus;
  verifiedAt: Date | null;
  failureReason: string | null;
};

/** Map a Stripe Identity VerificationSession status onto our stored row. */
export function fieldsFromStripeStatus(
  status: string,
  now: Date,
  reason?: string | null,
): IdentityFields {
  if (status === "verified") {
    return {
      isIDVerified: true,
      verificationStatus: "verified",
      verifiedAt: now,
      failureReason: null,
    };
  }
  if (status === "processing") {
    return {
      isIDVerified: false,
      verificationStatus: "pending",
      verifiedAt: null,
      failureReason: null,
    };
  }
  if (status === "requires_input") {
    return {
      isIDVerified: false,
      verificationStatus: "requires_input",
      verifiedAt: null,
      failureReason: reason || "Stripe needs another photo of the ID.",
    };
  }
  return {
    isIDVerified: false,
    verificationStatus: "failed",
    verifiedAt: null,
    failureReason: reason || "The ID check was not completed.",
  };
}
