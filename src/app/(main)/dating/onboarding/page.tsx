import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import DatingOnboardingFlow from "@/components/dating/DatingOnboardingFlow";

export default async function DatingOnboardingPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  // All users who reach this page are email-verified — that gate is enforced at the
  // page level (redirect to /login if !isEmailVerified).
  // ID verification (via Stripe) is a separate, optional step that adds a green
  // trust badge to the user's profile card. It does not affect platform access.

  // Fetch complete user data with dating profile and preferences
  const completeUser = await prisma.user.findFirst({
    where: {
      id: user.id,
      deletedAt: null,
    },
    select: getUserDataSelect(user.id),
  });

  if (!completeUser) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <DatingOnboardingFlow user={completeUser} />
    </div>
  );
} 