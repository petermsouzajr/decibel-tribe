import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import MatchList from "@/components/dating/MatchList";

export default async function MatchesPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  // session existence = email verified (login enforces this).
  if (!user.isDatingActive) {
    redirect("/dating");
  }

  return <MatchList />;
}

