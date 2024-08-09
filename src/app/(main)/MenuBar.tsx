import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { Bookmark, Home, Plus, SearchIcon } from "lucide-react";
import Link from "next/link";
import MessagesButton from "./MessagesButton";
import NotificationsButton from "./NotificationsButton";

interface MenuBarProps {
  className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
  const { user } = await validateRequest();

  if (!user) return null;

  const [unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false,
      },
    }),
    (await streamServerClient.getUnreadCount(user.id)).total_unread_count,
  ]);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Home"
        asChild
      >
        <Link href="/">
          <Home />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>
      <NotificationsButton
        initialState={{ unreadCount: unreadNotificationsCount }}
      />
      <MessagesButton initialState={{ unreadCount: unreadMessagesCount }} />
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Bookmarks"
        asChild
      >
        <Link href="/bookmarks">
          <Bookmark />
          <span className="hidden lg:inline">Bookmarks</span>
        </Link>
      </Button>
      {/* <Button
        variant="ghost"
        className="relative sm:hidden"
        title="Search"
        asChild
      >
        <Link href="/search">
          <SearchIcon />
        </Link>
      </Button> */}
      <Button
        variant="ghost"
        className="hidden items-center justify-start gap-3 bg-primary sm:flex" // Show on medium and larger screens
        title="Post"
        asChild
      >
        <Link href="/newpost">
          <Plus />
          <span className="hidden lg:inline">Post</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="fixed bottom-20 right-5 flex h-[3rem] w-[3rem] items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-[1.15] active:scale-105 sm:hidden" // Hide on small and larger screens
        title="Post"
        asChild
      >
        <Link href="/newpost">
          <Plus />
        </Link>
      </Button>
    </div>
  );
}
