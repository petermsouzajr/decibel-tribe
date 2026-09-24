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
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_MEMBERSHIP_WEBHOOK_SECRET;

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret");
      return NextResponse.json(
        { error: "Webhook configuration error" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!userId || !tier) {
          console.error("Missing userId or tier in session metadata", {
            sessionId: session.id,
          });
          break;
        }

        if (tier !== "person" && tier !== "id") {
          console.error("Invalid tier in session metadata", {
            sessionId: session.id,
            tier,
          });
          break;
        }

        const paid =
          session.payment_status === "paid" ||
          session.payment_status === "no_payment_required";
        if (!paid) {
          console.log("Checkout completed before payment. Waiting for the subscription event.", {
            sessionId: session.id,
            payment_status: session.payment_status,
          });
          break;
        }

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        await prisma.userDatingIdentityVerification.upsert({
          where: { userId },
          create: {
            id: crypto.randomUUID(),
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            hasPersonPerks: tier === "person",
            hasIdPerks: tier === "id",
          },
          update: {
            ...(customerId ? { stripeCustomerId: customerId } : {}),
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            ...(tier === "person" ? { hasPersonPerks: true } : { hasIdPerks: true }),
          },
        });

        console.log(`Granted ${tier} perks to user ${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const tier = subscription.metadata?.tier;

        if (!userId || !tier) {
          console.error("Missing userId or tier in subscription metadata", {
            subscriptionId: subscription.id,
          });
          break;
        }

        if (tier !== "person" && tier !== "id") {
          console.error("Invalid tier in subscription metadata", {
            subscriptionId: subscription.id,
            tier,
          });
          break;
        }

        const isActive = ["active", "trialing"].includes(subscription.status);
        const perkUpdate =
          tier === "person" ? { hasPersonPerks: isActive } : { hasIdPerks: isActive };

        await prisma.userDatingIdentityVerification.updateMany({
          where: { userId },
          data: {
            ...perkUpdate,
            ...(isActive ? { stripeSubscriptionId: subscription.id } : {}),
          },
        });
        if (!isActive) {
          await prisma.userDatingIdentityVerification.updateMany({
            where: { userId, stripeSubscriptionId: subscription.id },
            data: { stripeSubscriptionId: null },
          });
        }

        console.log(
          `Updated ${tier} perks for user ${userId}, active: ${isActive}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const tier = subscription.metadata?.tier;

        if (!userId || !tier) {
          console.error("Missing userId or tier in subscription metadata", {
            subscriptionId: subscription.id,
          });
          break;
        }

        if (tier !== "person" && tier !== "id") {
          console.error("Invalid tier in subscription metadata", {
            subscriptionId: subscription.id,
            tier,
          });
          break;
        }

        const perkUpdate =
          tier === "person" ? { hasPersonPerks: false } : { hasIdPerks: false };

        await prisma.userDatingIdentityVerification.updateMany({
          where: { userId },
          data: perkUpdate,
        });
        await prisma.userDatingIdentityVerification.updateMany({
          where: { userId, stripeSubscriptionId: subscription.id },
          data: { stripeSubscriptionId: null },
        });

        console.log(`Removed ${tier} perks from user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
