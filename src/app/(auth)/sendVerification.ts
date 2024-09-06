import crypto from "crypto";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream"; // Assuming you're using this for another purpose like user streaming
import sendVerificationEmail from "@/lib/sendEmail"; // Your existing email-sending module

// Generate a verification token with a 24-hour expiry
export async function generateAndSendVerification(
  userId: string,
  username: string,
  email: string,
  passwordHash: string,
) {
  const verificationToken = crypto.randomUUID(); // Generate secure token
  const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours expiration

  try {
    // Wrap database operations in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Create the user in the database
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: username,
          email,
          passwordHash,
        },
      });

      // Create user preferences (if needed)
      await tx.userPreferences.create({
        data: {
          userId: userId,
        },
      });

      // Create the email verification record with the token
      await tx.emailVerification.create({
        data: {
          userId,
          token: verificationToken,
          expiresAt: verificationTokenExpiry,
        },
      });

      // Additional logic: create a user on your streaming server if applicable
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
      });
    });

    // Send the verification email with the generated token
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${verificationToken}`;
    console.log("Verification URL sent to email:", verificationUrl);

    await sendVerificationEmail(email, verificationUrl);
    return { success: true };
  } catch (error) {
    console.error("Error generating or sending verification email:", error);
    return { error: "Something went wrong during the signup process." };
  }
}

// Resend verification email logic
export async function resendVerificationEmail(credential: string) {
  console.log("Resending verification email to:", credential);
  const verificationToken = crypto.randomUUID(); // Generate a new token
  const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours expiration

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: {
              equals: credential,
              mode: "insensitive",
            },
          },
          {
            username: {
              equals: credential,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    // Check if the user exists
    if (!existingUser) {
      return { error: "User not found." };
    }
    console.log("existingUser", existingUser);
    console.log("existingUser.id", existingUser.id);
    const userId = existingUser.id; // Extract userId from the fetched user
    const email = existingUser.email; // Extract email from the fetched user

    // Delete any existing verification token for this user
    await prisma.emailVerification.deleteMany({
      where: { userId },
    });

    // Insert the new verification token for this user
    await prisma.emailVerification.create({
      data: {
        userId,
        token: verificationToken,
        expiresAt: verificationTokenExpiry,
      },
    });

    // Send the verification email with the new token
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${verificationToken}`;
    console.log("Verification URL resent:", verificationUrl);

    await sendVerificationEmail(email, verificationUrl);
    return { success: true };
  } catch (error) {
    console.error("Error resending verification email:", error);
    return { error: "Failed to resend verification email." };
  }
}
