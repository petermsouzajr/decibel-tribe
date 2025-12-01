import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MatchList from "@/components/dating/MatchList";

export default async function MatchesPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  // Check if dating is active (non-verified users can access but won't have matches)
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isVerified: true, isDatingActive: true },
  });

  if (!currentUser?.isDatingActive) {
    redirect("/dating");
  }

  return <MatchList />;
}

