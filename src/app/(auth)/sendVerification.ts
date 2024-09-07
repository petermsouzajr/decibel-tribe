import crypto from "crypto";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream"; // Assuming you're using this for another purpose like user streaming
import sendVerificationEmail from "@/lib/sendEmail"; // Your existing email-sending module
import { google } from "@/auth";

// Generate a verification token with a 24-hour expiry
export async function generateAndSendVerification(
  userId: string,
  username: string,
  email: string,
  passwordHash: string,
) {
  const verificationToken = crypto.randomUUID(); // Generate secure token
  const currentDate = new Date();
  const verificationTokenExpiry = new Date(
    currentDate.getTime() + 1000 * 60 * 60 * 24,
  ); // 24 hours expiration

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
  const verificationToken = crypto.randomUUID(); // Generate a new token
  const currentDate = new Date();
  const verificationTokenExpiry = new Date(
    currentDate.getTime() + 1000 * 60 * 60 * 24,
  ); // 24 hours expiration

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

    // const userId = existingUser.id; // Extract userId from the fetched user
    // const userEmail = existingUser.email; // Extract email from the fetched user
    // const googleId = existingUser.googleId; // Extract Google ID from the fetched user
    const { id: userId, email: userEmail, isVerified, googleId } = existingUser;

    if (!userEmail && googleId)
      return { error: "You didn't sign up with email and password." };

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

    if (userEmail) {
      await sendVerificationEmail(userEmail, verificationUrl);
    } else {
      console.error("User did not sign up with email and password.");
    }
    return { success: true };
  } catch (error) {
    console.error("Error resending verification email:", error);
    return { error: "Failed to resend verification email." };
  }
}
