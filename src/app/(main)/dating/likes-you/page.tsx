import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LikesYouList from "@/components/dating/LikesYouList";

export default async function LikesYouPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  // Check if dating is active
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isVerified: true, isDatingActive: true },
  });

  if (!currentUser?.isDatingActive) {
    redirect("/dating");
  }

  return <LikesYouList />;
}



















