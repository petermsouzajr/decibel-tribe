"use server";

import prisma from "@/lib/prisma";
import { resendVerificationEmail } from "../sendVerification"; // The email sending logic
import { resetPasswordSchema, resetPasswordValues } from "@/lib/validation";

export async function resendVerification(
  credentials: resetPasswordValues,
): Promise<{ error: string }> {
  try {
    const { credential } = resetPasswordSchema.parse(credentials);

    // Find the user by username or email

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

    // If user doesn't exist
    if (!existingUser) {
      return { error: `User not found.` };
    }

    const { id: userId, email: userEmail, isVerified, googleId } = existingUser;

    // If user is not verified, resend verification email
    // if (!isVerified) {
    if (userEmail) {
      await resendVerificationEmail(userEmail); // Trigger email resend
      // }
      // return {
      // error: `Please check your email at ${credentials} for a new verification link.`,
      // };
      return { error: "" };
    }
    return { error: "" };
  } catch (error) {
    // const { id } = resetPasswordSchema.parse(credentials);
    // console.error("Error resending verification email", id);
    return {
      error: `Something went wrong. Please try again. ${credentials}`,
    };
  }
}
