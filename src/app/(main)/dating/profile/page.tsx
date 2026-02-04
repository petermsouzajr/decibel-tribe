import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DatingProfileEditor from "@/components/dating/DatingProfileEditor";

export default async function DatingProfilePage() {
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

  return <DatingProfileEditor />;
}




























