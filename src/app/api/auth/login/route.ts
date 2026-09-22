import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const usernameOrEmail = [
    body.identifier,
    body.email,
    body.username,
  ].find((value): value is string => typeof value === "string" && value.trim().length > 0);

  const password = typeof body.password === "string" ? body.password : "";

  if (!usernameOrEmail || !password) {
    return jsonError("Username and password are required", 400);
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: usernameOrEmail.trim(), mode: "insensitive" } },
          { email: { equals: usernameOrEmail.trim(), mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return jsonError("Invalid username or password", 401);
    }

    // Password first so deleted-account payloads cannot leak existence without credentials.
    if (!user.passwordHash) {
      return jsonError("Invalid username or password", 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return jsonError("Invalid username or password", 401);
    }

    if (user.deletedAt) {
      const gracePeriod = 90 * 24 * 60 * 60 * 1000;
      const timeSinceDeletion = Date.now() - user.deletedAt.getTime();

      if (timeSinceDeletion <= gracePeriod) {
        return jsonError("ACCOUNT_DELETED_WITHIN_GRACE_PERIOD", 401, {
          deletedAt: user.deletedAt.toISOString(),
          daysRemaining: Math.ceil(
            (gracePeriod - timeSinceDeletion) / (24 * 60 * 60 * 1000),
          ),
          userId: user.id,
        });
      }

      return jsonError("ACCOUNT_DELETED_EXPIRED", 401, {
        deletedAt: user.deletedAt.toISOString(),
        userId: user.id,
      });
    }

    if (!user.isEmailVerified) {
      return jsonError(
        "Please verify your email address before logging in. Check your inbox for a verification link.",
        401,
      );
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email ?? "",
          avatarUrl: user.avatarUrl,
          isDatingActive: user.isDatingActive,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
        token: session.id,
        refreshToken: session.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("An error occurred during login", 500);
  }
}
