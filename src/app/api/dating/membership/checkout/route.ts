import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();

    const body = await request.json();
    const { tier } = body;

    if (!tier || (tier !== "person" && tier !== "id")) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'person' or 'id'." },
        { status: 400 }
      );
    }

    const priceId =
      tier === "person"
        ? process.env.STRIPE_PRICE_PERSON_REWARDS
        : process.env.STRIPE_PRICE_ID_REWARDS;

    if (!priceId) {
      console.error(`Missing Stripe price ID for tier: ${tier}`);
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    const identityRecord = await prisma.userDatingIdentityVerification.findUnique({
      where: { userId: user.id },
      select: { stripeCustomerId: true },
    });

    let customerId = identityRecord?.stripeCustomerId;

    if (!customerId) {
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, displayName: true, username: true },
      });

      const customer = await stripe.customers.create({
        email: userData?.email || undefined,
        name: userData?.displayName || userData?.username || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      await prisma.userDatingIdentityVerification.upsert({
        where: { userId: user.id },
        create: {
          id: crypto.randomUUID(),
          userId: user.id,
          stripeCustomerId: customerId,
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://decibeltribe.com";
    const successUrl = `${baseUrl}/dating/membership/success?tier=${tier}`;
    const cancelUrl = `${baseUrl}/dating/membership/cancel`;

    const deepLinkSuccessUrl = `datingtribe://membership/success?tier=${tier}`;
    const deepLinkCancelUrl = `datingtribe://membership/cancel`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier: tier,
        },
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      deepLinkSuccessUrl,
      deepLinkCancelUrl,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
