import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import LikesYouList from "@/components/dating/LikesYouList";

export default async function LikesYouPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  // session existence = email verified (login enforces this).
  if (!user.isDatingActive) {
    redirect("/dating");
  }

  return <LikesYouList />;
}




























