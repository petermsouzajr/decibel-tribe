import { google } from "@/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = await google.createAuthorizationURL(state, codeVerifier, {
      scopes: ["profile", "email"],
    });

    (await cookies()).set("state", state, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    });

    (await cookies()).set("code_verifier", codeVerifier, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error creating Google auth URL:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google login" },
      { status: 500 },
    );
  }
}
