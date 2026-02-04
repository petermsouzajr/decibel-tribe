"use server";

import prisma from "@/lib/prisma";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import bcrypt from "bcryptjs"; // Import bcryptjs
import { generateIdFromEntropySize } from "lucia";
import { generateAndSendVerification } from "../sendVerification";
import { validateHoneypot } from "@/lib/honeypot";

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error?: string; success?: boolean }> {
  try {
    const honeypotError = validateHoneypot(credentials);
    if (honeypotError) {
      return { error: honeypotError.error };
    }

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
    console.error("Sign up error:", error); // Log specific error
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
