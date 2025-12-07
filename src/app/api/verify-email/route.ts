import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
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
      return NextResponse.redirect(new URL("/", req.url));
    }

    const user = await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: { isVerified: true },
    });

    if (user.pendingEmail) {
      await prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { email: user.pendingEmail },
      });

      await prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { pendingEmail: null },
      });
    }
    await prisma.emailVerification.delete({
      where: { id: verificationRecord.id },
    });

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    (await cookies()).set(
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
