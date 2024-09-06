"use server";

import prisma from "@/lib/prisma";
import { resendVerificationEmail } from "../sendVerification"; // The email sending logic
import {
  loginSchema,
  LoginValues,
  resetPasswordSchema,
  resetPasswordValues,
} from "@/lib/validation";

export async function resendVerification(
  credentials: resetPasswordValues,
): Promise<{ error: string }> {
  console.log("credentials", credentials);
  try {
    const { credential } = resetPasswordSchema.parse(credentials);

    // Find the user by username or email
    console.log("credentials", credentials);
    console.log("credentials.id", credentials);
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

    // If user doesn't exist
    if (!existingUser) {
      console.log("credentials2", credentials);
      console.log("credentials.id2", credentials);
      return { error: `User not found.${credentials}${" "}${credentials}` };
    }

    // If user is not verified, resend verification email
    if (!existingUser.isVerified) {
      if (existingUser.email) {
        await resendVerificationEmail(existingUser.email); // Trigger email resend
      }
      return {
        error: `Your account is not verified. Please check your email at ${credentials} for a new verification link.`,
      };
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
