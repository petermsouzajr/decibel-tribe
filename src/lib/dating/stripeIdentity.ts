const STRIPE_API = "https://api.stripe.com/v1/identity/verification_sessions";

export type StripeVerificationSession = {
  id: string;
  status: string;
  url: string | null;
  last_error?: { reason?: string | null } | null;
  metadata?: { userId?: string };
};

export async function createDocumentSession(input: {
  secretKey: string;
  userId: string;
  returnUrl: string;
}): Promise<StripeVerificationSession> {
  const body = new URLSearchParams();
  body.set("type", "document");
  body.set("metadata[userId]", input.userId);
  body.set("return_url", input.returnUrl);
  body.set("options[document][require_matching_selfie]", "true");

  const response = await fetch(STRIPE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Stripe Identity session failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  return response.json() as Promise<StripeVerificationSession>;
}
