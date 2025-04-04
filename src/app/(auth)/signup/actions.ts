"use server";

import prisma from "@/lib/prisma";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import bcrypt from "bcryptjs"; // Import bcryptjs
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { generateAndSendVerification } from "../sendVerification";

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { username, email, password } = signUpSchema.parse(credentials);

    // Use bcryptjs hashing
    const saltRounds = 10; // Standard salt rounds (adjust if needed)
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userId = generateIdFromEntropySize(10);

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return {
        error: "Username already taken",
      };
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) {
      return {
        error: "Email already registered",
      };
    }

    await generateAndSendVerification(userId, username, email, passwordHash);

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Sign up error:", error); // Log specific error
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
