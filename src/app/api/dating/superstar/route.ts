import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { refreshSuperstars } from "@/lib/dating/superstar";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await prisma.userDatingPreferences.findUnique({
      where: { userId: user.id },
      select: { superstarBalance: true, superstarNextAt: true, createdAt: true },
    });
    if (!prefs) {
      return NextResponse.json({ error: "Dating preferences are required." }, { status: 400 });
    }

    const refreshed = refreshSuperstars(prefs.superstarBalance, prefs.superstarNextAt, prefs.createdAt);
    const changed =
      refreshed.balance !== prefs.superstarBalance ||
      prefs.superstarNextAt?.getTime() !== refreshed.nextAt.getTime();

    if (changed) {
      await prisma.userDatingPreferences.update({
        where: { userId: user.id },
        data: { superstarBalance: refreshed.balance, superstarNextAt: refreshed.nextAt },
      });
    }

    return NextResponse.json({
      balance: refreshed.balance,
      nextAt: refreshed.nextAt.toISOString(),
    });
  } catch (error) {
    console.error("Error loading Superstar balance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
