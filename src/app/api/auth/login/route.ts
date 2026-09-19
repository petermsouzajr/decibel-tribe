import { lucia } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: any) {
  const body = await req.json();
  const { identifier, username, email, password } = body;

  // Accept identifier (mobile app), username, or email
  // Mobile app sends identifier (lowercased), web/legacy may send username/email
  const usernameOrEmail = identifier || email || username;

  if (!usernameOrEmail || !password) {
    return NextResponse.json(
      { error: "Identifier/username/email and password are required" },
      { status: 400 }
    );
  }

  try {
    // Find user by username or email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: usernameOrEmail, mode: "insensitive" } },
          { email: { equals: usernameOrEmail, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if user is deleted
    if (user.deletedAt) {
      const gracePeriod = 90 * 24 * 60 * 60 * 1000;
      const timeSinceDeletion = Date.now() - user.deletedAt.getTime();

      if (timeSinceDeletion <= gracePeriod) {
        return NextResponse.json(
          {
            error: "ACCOUNT_DELETED_WITHIN_GRACE_PERIOD",
            deletedAt: user.deletedAt.toISOString(),
            daysRemaining: Math.ceil((gracePeriod - timeSinceDeletion) / (24 * 60 * 60 * 1000)),
          },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          {
            error: "ACCOUNT_DELETED_EXPIRED",
            deletedAt: user.deletedAt.toISOString(),
          },
          { status: 401 }
        );
      }
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Email verification required
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before logging in. Check your inbox for a verification link." },
        { status: 401 }
      );
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    // Set session cookie
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // Return API response with user data and token
    // Mobile app expects: user, token, refreshToken
    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isDatingActive: user.isDatingActive,
          isAdmin: user.isAdmin,
        },
        token: session.id, // Session ID serves as the token
        refreshToken: session.id, // Using same session ID for now
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
