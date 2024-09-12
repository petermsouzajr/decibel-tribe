import prisma from "@/lib/prisma";
import { lucia } from "@/auth"; // Import your authentication system
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers"; // To set the session cookie

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    // Find the verification token in the database
    const verificationRecord = await prisma.emailVerification.findFirst({
      where: {
        token,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!verificationRecord) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Mark user as verified
    const user = await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: { isVerified: true },
    });

    // Delete the token after verification
    await prisma.emailVerification.delete({
      where: { id: verificationRecord.id },
    });

    // Create a new session for the user
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set the session cookie in the response
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("Verification failed", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
