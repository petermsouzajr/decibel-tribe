import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUnreadCountSafe } from "@/lib/stream";
import MenuBarContent from "./MenuBarContent";
import { UserData } from "@/lib/types";

interface MenuBarProps {
  className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
  const result = await validateRequest();
  const user: UserData | null = result.user as UserData | null;

  if (!user) return null;

  const [unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false,
      },
    }),
    getUnreadCountSafe(user),
  ]);

  return (
    <MenuBarContent
      className={className}
      user={user}
      unreadNotificationsCount={unreadNotificationsCount}
      unreadMessagesCount={unreadMessagesCount}
    />
  );
}
