"use server";

import prisma from "@/lib/prisma";
import { resendVerificationEmail } from "../sendVerification";
import { resetPasswordSchema, resetPasswordValues } from "@/lib/validation";

export async function resendVerification(
  credentials: resetPasswordValues,
): Promise<{ error: string }> {
  try {
    const { credential } = resetPasswordSchema.parse(credentials);

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
      return { error: `User not found.` };
    }

    const { id: userId, email: userEmail, isVerified, googleId } = existingUser;

    if (userEmail) {
      await resendVerificationEmail(userEmail);
      return { error: "" };
    }
    return { error: "" };
  } catch (error) {
    return {
      error: `Something went wrong. Please try again. ${credentials}`,
    };
  }
}
