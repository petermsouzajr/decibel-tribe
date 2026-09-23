import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function GET() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const identityRecord = await prisma.userDatingIdentityVerification.findUnique({
      where: { userId: user.id },
      select: {
        hasPersonPerks: true,
        hasIdPerks: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });

    if (!identityRecord) {
      return NextResponse.json({
        hasPersonPerks: false,
        hasIdPerks: false,
        subscription: null,
      });
    }

    let subscriptionStatus = null;

    if (identityRecord.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          identityRecord.stripeSubscriptionId
        );
        subscriptionStatus = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          tier: subscription.metadata.tier || null,
        };
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    }

    return NextResponse.json({
      hasPersonPerks: identityRecord.hasPersonPerks,
      hasIdPerks: identityRecord.hasIdPerks,
      subscription: subscriptionStatus,
    });
  } catch (error) {
    console.error("Error fetching membership status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
