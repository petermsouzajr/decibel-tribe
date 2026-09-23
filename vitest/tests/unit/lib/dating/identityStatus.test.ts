import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { fieldsFromStripeStatus } from "@/lib/dating/identityStatus";
import { verifyStripeSignature } from "@/lib/dating/stripeSignature";

describe("Stripe identity status", () => {
  const now = new Date("2026-09-23T12:00:00.000Z");

  it("marks a verified session as ID verified", () => {
    expect(fieldsFromStripeStatus("verified", now)).toMatchObject({
      isIDVerified: true,
      verificationStatus: "verified",
      verifiedAt: now,
    });
  });

  it("keeps a processing session pending", () => {
    expect(fieldsFromStripeStatus("processing", now).verificationStatus).toBe("pending");
  });

  it("asks for another try when Stripe needs input", () => {
    expect(fieldsFromStripeStatus("requires_input", now, "blurry").failureReason).toBe("blurry");
  });
});

describe("Stripe webhook signature", () => {
  it("accepts a current v1 signature", () => {
    const payload = "{\"id\":\"evt_1\"}";
    const secret = "whsec_test";
    const timestamp = 1_700_000_000;
    const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
    expect(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, timestamp)).toBe(true);
  });

  it("rejects a stale signature", () => {
    const payload = "{}";
    const secret = "whsec_test";
    const timestamp = 1_700_000_000;
    const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
    expect(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, timestamp + 301)).toBe(false);
  });
});
