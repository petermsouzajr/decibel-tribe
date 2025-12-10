import FollowButton from "@/components/FollowButton";
import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import {
  CalendarDays,
  MessageCircle,
  ThumbsDown,
  ThumbsUp,
  TicketCheck,
  User2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "../SessionProvider";
import UserTooltip from "@/components/UserTooltip";

interface NotificationProps {
  notification: NotificationData;
}

export default function Notification({ notification }: NotificationProps) {
  const user = useSession().user;

  const notificationTypeMap: Record<
    NotificationType,
    { issuer: object; message: string; icon: JSX.Element; href: string }
  > = {
    FOLLOW: {
      issuer: notification.issuer,
      message: "followed you",
      icon: <User2 className="size-7 text-primary" />,
      href: `/users/${notification.issuer.username}`,
    },
    COMMENT: {
      issuer: notification.issuer,
      message: `commented on your post`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    LIKE: {
      issuer: notification.issuer,
      message: `liked your post`,
      icon: <ThumbsUp className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    DISLIKE: {
      issuer: notification.issuer,
      message: `disliked your post`,
      icon: <ThumbsDown className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    EVENT_ATTENDEE: {
      issuer: notification.issuer,
      message: `is attending your event: ${notification.event?.title ? `"${notification.event.title}"` : notification.event?.location}`,
      icon: <TicketCheck className="size-7 text-primary" />,
      href: `/events/${notification.event?.id}`,
    },
    EVENT_CANCELLED: {
      issuer: notification.issuer,
      message: `an event on your calendar has been CANCELLED: ${notification.event?.title ? `"${notification.event.title}"` : notification.event?.location}`,
      icon: <CalendarDays className="size-7 text-primary" />,
      href: `/events/${notification.event?.id}`,
    },
    MATCH: {
      issuer: notification.issuer,
      message: `You matched with ${notification.issuer.displayName}`,
      icon: <User2 className="size-7 text-primary" />,
      href: `/dating/matches`,
    },
  };

  const { message, icon, href } = notificationTypeMap[notification.type];

  return (
    <article className="group/post space-y-3 rounded-2xl border-2 bg-card p-5 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="flex w-full flex-wrap gap-3">
          <UserTooltip user={notification.issuer}>
            <Link href={`/users/${notification.issuer.username}`}>
              <UserAvatar avatarUrl={notification.issuer.avatarUrl} size={36} />
            </Link>
          </UserTooltip>
          <div className="min-w-0 flex-1">
            <UserTooltip user={notification.issuer}>
              <Link
                href={`/users/${notification.issuer.username}`}
                className="block font-medium hover:underline"
              >
                <div className="flex w-full flex-wrap items-center">
                  <span className="max-w-[75%] flex-shrink truncate">
                    {notification.issuer.displayName}
                  </span>
                  <span className="max-w-[25%] flex-shrink truncate pl-2 text-muted-foreground">
                    @{notification.issuer.username}
                  </span>
                  <span className="truncate pl-2 text-sm hover:underline">
                    {notification.issuer.bio}
                  </span>
                </div>
              </Link>
            </UserTooltip>
            <Link
              href={href}
              className="block text-sm text-muted-foreground hover:underline"
              suppressHydrationWarning
            >
              {formatRelativeDate(notification.createdAt)}
            </Link>
          </div>

          <FollowButton
            userId={notification.issuer.id}
            initialState={{
              followers: notification.issuer._count.followers,
              isFollowedByUser: notification.issuer.followers.some(
                ({ followerId }) => followerId === user.id,
              ),
            }}
          />
        </div>
      </div>
      <Link href={href}>
        <div className="flex items-center gap-3">
          <div className="my-1">{icon}</div>
          <span>{message}</span>
        </div>
        {notification.post && (
          <div className="line-clamp-3 whitespace-pre-line text-muted-foreground">
            {notification.post.content}
          </div>
        )}
      </Link>
    </article>
  );
}
