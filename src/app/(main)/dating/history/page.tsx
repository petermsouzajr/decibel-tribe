import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SwipeHistory from "@/components/dating/SwipeHistory";

export default async function HistoryPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  // Check if dating is active
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isDatingActive: true },
  });

  if (!currentUser?.isDatingActive) {
    redirect("/dating");
  }

  return <SwipeHistory />;
}

















