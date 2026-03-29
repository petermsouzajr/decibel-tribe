import crypto from "crypto";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import sendVerificationEmail from "@/lib/sendEmail";

export async function generateAndSendVerification(
  userId: string,
  username: string,
  email: string,
  passwordHash: string,
) {
  const verificationToken = crypto.randomUUID();
  const currentDate = new Date();
  const verificationTokenExpiry = new Date(
    currentDate.getTime() + 1000 * 60 * 60 * 24,
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: username,
          email,
          passwordHash,
        },
      });

      await tx.userPreferences.create({
        data: {
          userId: userId,
        },
      });

      await tx.emailVerification.create({
        data: {
          userId,
          token: verificationToken,
          expiresAt: verificationTokenExpiry,
        },
      });

      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
      });
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${verificationToken}`;

    await sendVerificationEmail(email, verificationUrl);
    return { success: true };
  } catch (error) {
    console.error("Error generating or sending verification email:", error);
    return { error: "Something went wrong during the signup process." };
  }
}

export async function resendVerificationEmail(credential: string) {
  const verificationToken = crypto.randomUUID();
  const currentDate = new Date();
  const verificationTokenExpiry = new Date(
    currentDate.getTime() + 1000 * 60 * 60 * 24,
  );

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
            pendingEmail: {
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

    if (!existingUser) {
      return { error: "User not found." };
    }

    let { id: userId, email: userEmail, isEmailVerified, googleId } = existingUser;
    userEmail = isEmailVerified ? existingUser.pendingEmail : existingUser.email;

    if (!userEmail && googleId)
      return { error: "You didn't sign up with email and password." };

    await prisma.emailVerification.deleteMany({
      where: { userId },
    });

    await prisma.emailVerification.create({
      data: {
        userId,
        token: verificationToken,
        expiresAt: verificationTokenExpiry,
      },
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${verificationToken}`;
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
