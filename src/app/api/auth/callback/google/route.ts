import { google, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";

const generateUniqueUsername = async (baseUsername: string, prisma: any) => {
  let username = baseUsername;
  let isUnique = false;

  while (!isUnique) {
    const existingUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!existingUser) {
      isUnique = true;
    } else {
      const randomSuffix = randomInt(1000, 9999);
      username = `${baseUsername}${randomSuffix}`;
    }
  }

  return username;
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  const storedState = (await cookies()).get("state")?.value;
  const storedCodeVerifier = (await cookies()).get("code_verifier")?.value;

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response(null, { status: 400 });
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      .json<{ id: string; name: string; email: string }>();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.id }, { email: googleUser.email }],
      },
    });

    if (existingUser) {
      if (!existingUser.googleId) {
        try {
          await prisma.user.update({
            where: {
              id: existingUser.id,
            },
            data: {
              googleId: googleUser.id,
            },
          });
        } catch (updateError) {
          console.error(
            "Failed to link Google ID to existing user:",
            updateError,
          );
          return NextResponse.json(
            { error: "Internal server error during Google account linking" },
            { status: 500 },
          );
        }
      }

      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    const userId = generateIdFromEntropySize(10);
    const baseUsername = slugify(googleUser.name);
    const uniqueUsername = await generateUniqueUsername(baseUsername, prisma);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username: uniqueUsername,
          displayName: googleUser.name,
          googleId: googleUser.id,
          email: googleUser.email,
          isEmailVerified: true,
        },
      });
      await streamServerClient.upsertUser({
        id: userId,
        username: uniqueUsername,
        name: uniqueUsername,
      });
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    if (error instanceof OAuth2RequestError) {
      return NextResponse.json(
        { error: "Invalid OAuth request", details: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error during Google login" },
      { status: 500 },
    );
  }
}
