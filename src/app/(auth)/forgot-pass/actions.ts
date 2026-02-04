"use server";

import prisma from "@/lib/prisma";
import { resendVerificationEmail } from "../sendVerification";
import { resetPasswordSchema, resetPasswordValues } from "@/lib/validation";

import { validateHoneypot } from "@/lib/honeypot";

export async function resendVerification(
  credentials: resetPasswordValues,
): Promise<{ error: string }> {
  try {
    const honeypotError = validateHoneypot(credentials);
    if (honeypotError) {
      return { error: honeypotError.error };
    }

    const { credential } = resetPasswordSchema.parse(credentials);

    if (!credential) {
      return { error: "Email or username is required" };
    }

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

    const { id: userId, email: userEmail } = existingUser;

    if (userEmail) {
      await resendVerificationEmail(userEmail);
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: null,
        },
      });
      return { error: "" };
    }
    return { error: "" };
  } catch (error) {
    return {
      error: `Something went wrong. Please try again. ${credentials}`,
    };
  }
}
