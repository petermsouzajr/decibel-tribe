import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const redirectUrl = new URL("/", url.origin);

  if (!token) {
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const verificationRecord = await prisma.emailVerification.findFirst({
      where: {
        token,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!verificationRecord) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const user = await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: { isVerified: true },
    });

    await prisma.emailVerification.delete({
      where: { id: verificationRecord.id },
    });

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Verification failed", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
