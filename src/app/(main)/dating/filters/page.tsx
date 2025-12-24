import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DatingFiltersPanel from "@/components/dating/DatingFiltersPanel";
import DatingHeader from "@/components/dating/DatingHeader";

export default async function DatingFiltersPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isDatingActive: true },
  });

  if (!currentUser?.isDatingActive) {
    redirect("/dating");
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#050B1A] via-[#050B1A] to-[#030712] pb-16">
      <div className="w-full px-2 sm:px-4 lg:max-w-2xl lg:mx-auto">
        <DatingHeader title="Filters" />
        <DatingFiltersPanel asModal={false} />
      </div>
    </div>
  );
}

