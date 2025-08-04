"use server";

import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  try {
    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: username, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return { error: "Invalid username or password" };
    }

    // Check if user is deleted
    if (user.deletedAt) {
      // Check if within grace period (90 days)
      const gracePeriod = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
      const timeSinceDeletion = Date.now() - user.deletedAt.getTime();
      
      if (timeSinceDeletion <= gracePeriod) {
        // User is within grace period - offer reactivation
        return { 
          error: "ACCOUNT_DELETED_WITHIN_GRACE_PERIOD",
          deletedAt: user.deletedAt?.toISOString(),
          daysRemaining: Math.ceil((gracePeriod - timeSinceDeletion) / (24 * 60 * 60 * 1000)),
          userId: user.id
        };
      } else {
        // Grace period expired - offer fresh start
        return { 
          error: "ACCOUNT_DELETED_EXPIRED",
          deletedAt: user.deletedAt?.toISOString(),
          userId: user.id
        };
      }
    }

    // Verify password
    if (!user.passwordHash) {
      return { error: "Invalid username or password" };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return { error: "Invalid username or password" };
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    redirect("/");
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An error occurred during login" };
  }
}
