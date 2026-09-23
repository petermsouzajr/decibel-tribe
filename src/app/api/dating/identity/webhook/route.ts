import prisma from "@/lib/prisma";
import { fieldsFromStripeStatus } from "@/lib/dating/identityStatus";
import { verifyStripeSignature } from "@/lib/dating/stripeSignature";
import type { StripeVerificationSession } from "@/lib/dating/stripeIdentity";
import { NextRequest, NextResponse } from "next/server";

type StripeEvent = {
  type: string;
  data: { object: StripeVerificationSession };
};

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!event.type?.startsWith("identity.verification_session.")) {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object;
  const userId = session?.metadata?.userId;
  if (!session?.id || !userId) {
    return NextResponse.json({ received: true });
  }

  const fields = fieldsFromStripeStatus(session.status, new Date(), session.last_error?.reason);
  const current = await prisma.userDatingIdentityVerification.findUnique({
    where: { userId },
  });

  // A late event from an older session must not undo a newer check.
  if (current?.stripeVerificationId && current.stripeVerificationId !== session.id && current.isIDVerified) {
    return NextResponse.json({ received: true });
  }

  await prisma.userDatingIdentityVerification.upsert({
    where: { userId },
    create: {
      userId,
      verificationMethod: "stripe_identity",
      stripeVerificationId: session.id,
      ...fields,
    },
    update: {
      stripeVerificationId: session.id,
      ...fields,
    },
  });

  return NextResponse.json({ received: true });
}
