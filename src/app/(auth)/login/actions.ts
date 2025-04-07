"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { loginSchema, LoginValues } from "@/lib/validation";
// import { verify } from "@node-rs/argon2";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as bcrypt from "bcryptjs";
import { resendVerificationEmail } from "../sendVerification";

export async function login(
  credentials: LoginValues,
  isTestEnvironment: boolean = false,
): Promise<{ error?: string; sessionCookie?: any }> {
  try {
    const { username, password } = loginSchema.parse(credentials);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: {
              equals: username,
              mode: "insensitive",
            },
          },
          {
            username: {
              equals: username,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (!existingUser || !existingUser.passwordHash) {
      console.log(
        `Login attempt failed: User ${username} not found or no hash.`,
      );
      return {
        error: "Incorrect username or password",
      };
    }

    if (!existingUser.isVerified) {
      if (existingUser.email) {
        await resendVerificationEmail(existingUser.email);
      }
      return {
        error: `Your account is not verified. Please check your email at ${username} for a new verification link.`,
      };
    }

    const validPassword = await bcrypt.compare(
      password,
      existingUser.passwordHash,
    );

    if (!validPassword) {
      console.log(
        `Login attempt failed: Incorrect password for user ${username}.`,
      );
      return {
        error: "Incorrect username or password",
      };
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    if (isTestEnvironment) {
      return { sessionCookie };
    }

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Login error:", error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
