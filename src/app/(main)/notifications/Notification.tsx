import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import {
  Heart,
  MessageCircle,
  ThumbsDown,
  ThumbsUp,
  User2,
} from "lucide-react";
import Link from "next/link";

interface NotificationProps {
  notification: NotificationData;
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    { message: string; icon: JSX.Element; href: string }
  > = {
    FOLLOW: {
      message: `@${notification.issuer.username} followed you`,
      icon: <User2 className="size-7 text-primary" />,
      href: `/users/${notification.issuer.username}`,
    },
    COMMENT: {
      message: `@${notification.issuer.username} commented on your post`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    LIKE: {
      message: `@${notification.issuer.username} liked your post`,
      icon: <ThumbsUp className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    DISLIKE: {
      message: `@${notification.issuer.username} disliked your post`,
      icon: <ThumbsDown className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
  };

  const { message, icon, href } = notificationTypeMap[notification.type];

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-2xl border-2 bg-card p-5 shadow-sm transition-colors hover:bg-card/70",
        !notification.read && "border-2 bg-primary/10",
      )}
    >
      <Link href={`/users/${notification.issuer.username}`} className="block">
        <div className="flex items-center gap-3">
          <UserAvatar avatarUrl={notification.issuer.avatarUrl} size={36} />
          <div className="flex flex-col gap-1 sm:flex-row">
            <span className="font-bold">{notification.issuer.displayName}</span>
            <span className="text-muted-foreground">
              @{notification.issuer.username}
            </span>
          </div>
        </div>
      </Link>
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
