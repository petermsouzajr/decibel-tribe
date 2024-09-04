"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import sendVerificationEmail from "@/lib/sendEmail"; // A function to send emails

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  console.log("Signing up", credentials);
  try {
    const { username, email, password } = signUpSchema.parse(credentials);

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

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

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

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

    // Send verification email with token
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${verificationToken}`;
    console.log("Verification URL in action", verificationUrl);
    await sendVerificationEmail(email, verificationUrl);

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
