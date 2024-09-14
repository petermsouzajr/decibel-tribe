"use client";
import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { Bookmark, CalendarDays, Home, Plus, TicketCheck } from "lucide-react";
import Link from "next/link";
import MessagesButton from "./MessagesButton";
import NotificationsButton from "./NotificationsButton";
import { use, useState } from "react";
import PostDialog from "./PostDialogue";
import { useRouter } from "next/navigation";
import { UserData } from "@/lib/types";
import { usePathname } from "next/navigation";

interface MenuBarContentProps {
  className?: string;
  user: UserData;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
}

export default function MenuBarContent({
  className,
  user,
  unreadNotificationsCount,
  unreadMessagesCount,
}: MenuBarContentProps) {
  const [showPostDialog, setShowPostDialog] = useState(false);

  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path ? "bg-accent text-white" : "";

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className={`flex items-center justify-start gap-3 ${isActive("/")}`}
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
        isActive={isActive}
      />
      <MessagesButton
        initialState={{ unreadCount: unreadMessagesCount }}
        isActive={isActive}
      />
      <Button
        variant="ghost"
        className={`hidden w-full items-center justify-start gap-3 sm:flex ${isActive("/bookmarks")}`}
        title="Bookmarks"
        asChild
      >
        <Link href="/bookmarks">
          <Bookmark />
          <span className="hidden lg:inline">Bookmarks</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={`flex items-center justify-start gap-3 ${isActive("/calendar")}`}
        title="Calendar"
        asChild
      >
        <Link href="/calendar">
          <CalendarDays />
          <span className="hidden lg:inline">Calendar</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={`flex items-center justify-start gap-3 ${isActive("/events")}`}
        title="Events"
        asChild
      >
        <Link href="/events">
          <TicketCheck />
          <span className="hidden lg:inline">Events</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="hidden w-full items-center justify-start gap-3 bg-primary text-white sm:flex"
        title="Post"
        onClick={() => setShowPostDialog(true)}
      >
        <Plus />
        <span className="hidden lg:inline">Post</span>
      </Button>
      <Button
        variant="ghost"
        className="fixed bottom-20 right-5 flex h-[3rem] w-[3rem] items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-[1.15] active:scale-105 sm:hidden" // Hide on small and larger screens
        title="Post"
        onClick={() => setShowPostDialog(true)}
      >
        <Plus />
      </Button>
      <PostDialog open={showPostDialog} onOpenChange={setShowPostDialog} />
    </div>
  );
}
