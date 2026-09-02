import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const { user } = await validateRequest();
  return user?.isAdmin ?? false;
}

/**
 * Require admin access - redirects to home if not admin
 */
export async function requireAdmin() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/");
  }

  return user;
}

/**
 * Get admin user or null
 */
export async function getAdminUser() {
  const { user } = await validateRequest();
  return user?.isAdmin ? user : null;
}
